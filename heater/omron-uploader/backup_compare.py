"""Read-only comparison of E5CC-T programme backups from different sessions.

Compares controller raw memory and sensor-dependent *interpretation*.
Never connects to or modifies the controller and never scales DA words.
"""
from __future__ import annotations
from pathlib import Path
from backup_explorer import load_backup
from programme_audit import compare_programmes,interpreted_temperature_changes,interpreted_slope_changes

def compare_saved_backups(before_path,after_path):
    before=load_backup(before_path)
    after=load_backup(after_path)
    first=before.get("controller",{}).get("model10")
    second=after.get("controller",{}).get("model10")
    if not first or not second or first!=second:
        raise ValueError("The backups do not confirm the same controller model prefix")
    old_type=before.get("preflight",{}).get("C3:0000")
    new_type=after.get("preflight",{}).get("C3:0000")
    comparison=compare_programmes(before["programmes"],after["programmes"],
                                   sensor_changed=(old_type!=new_type))
    estimates,warnings=interpreted_temperature_changes(
        before["programmes"],after["programmes"],old_type,new_type)
    slope_estimates,slope_warnings=interpreted_slope_changes(
        before["programmes"],after["programmes"],old_type,new_type)
    warnings.extend(slope_warnings)
    old_global=before.get("preflight",{})
    new_global=after.get("preflight",{})
    comparable=set(old_global) & set(new_global)
    settings_changes=[
        {"register":key,"before_raw":old_global[key],"after_raw":new_global[key]}
        for key in sorted(comparable) if old_global[key]!=new_global[key]
    ]
    unavailable=sorted(set(old_global)^set(new_global))
    return {
        "schema":"e5cct-backup-comparison-1",
        "before_file":str(Path(before_path).resolve()),
        "after_file":str(Path(after_path).resolve()),
        "model10":first,
        "before_input_type":old_type,
        "after_input_type":new_type,
        "raw_words_compared":comparison["memory_words_compared"],
        "changed_raw_words":comparison["changes_total"],
        "raw_changes_by_programme":comparison["changes_by_programme"],
        "raw_differences":comparison["differences"],
        "global_settings_changes":settings_changes,
        "global_settings_not_comparable":unavailable,
        "interpreted_target_changes":estimates,
        "interpreted_slope_changes":slope_estimates,
        "interpretation_warnings":warnings,
        "requires_review":bool(
            old_type!=new_type or comparison["changes_total"] or settings_changes
            or unavailable or warnings or estimates or slope_estimates),
        "warning":(
            "An unchanged raw DA word is NOT evidence of an unchanged temperature "
            "when sensor resolution changes. Interpretations are estimates from "
            "our decoder, not physical controller-panel measurements."),
    }

def comparison_text(result,max_targets=80,max_raw=40):
    """Readable comparison: keep raw and degree differences distinct."""
    def sensor_name(raw):
        return {5:"Type K 5 (1 °C)",6:"Type K 6 (0.1 °C)"}.get(raw,f"Unknown ({raw})")
    lines=[
        "SAVED PROGRAMME BACKUPS — READ-ONLY COMPARISON",
        "",
        "Before: "+result["before_file"],
        "After:  "+result["after_file"],
        "Controller prefix: "+result["model10"]+
        " (model prefix alone is NOT unique device identification)",
        "Sensor before: "+sensor_name(result["before_input_type"]),
        "Sensor after:  "+sensor_name(result["after_input_type"]),
        "",
        f"RAW MEMORY: {result['raw_words_compared']} words compared; "
        f"{result['changed_raw_words']} different.",
        f"INTERPRETED TEMPERATURES: {len(result['interpreted_target_changes'])} "
        "ramp/step targets may differ.",
        f"INTERPRETED SLOPES: {len(result['interpreted_slope_changes'])} "
        "ramp rates may differ.",
        "",
    ]
    if result["before_input_type"]!=result["after_input_type"]:
        lines+=["SENSOR INPUT CHANGED — RECHECK PROGRAMME TEMPERATURES",
                "A controller may retain the same DA words yet display different "
                "temperatures under the new resolution.",""]
    lines+=["GLOBAL SETTINGS (recorded in both backups)"]
    if not result["global_settings_changes"]:
        lines.append("No changes in comparable global preflight settings.")
    for row in result["global_settings_changes"]:
        lines.append(
            f"{row['register']}: {row['before_raw']} -> {row['after_raw']}")
    if result["global_settings_not_comparable"]:
        lines.append("Not comparable (missing from one backup): "+
                     ", ".join(result["global_settings_not_comparable"]))
    lines+=["","POSSIBLE TARGET TEMPERATURE CHANGES (our decoder, NOT panel-verified)"]
    if not result["interpreted_target_changes"]:
        lines+=["No changed targets identified by the limited ramp/step decoder."]
    for row in result["interpreted_target_changes"][:max_targets]:
        lines.append(
            f"Programme {row['programme']}, segment {row['segment']}: "
            f"{row['old_interpretation_c']:g} °C -> "
            f"{row['new_interpretation_c']:g} °C "
            f"[{row['register']}, raw {row['raw_before']} -> {row['raw_after']}]")
    remaining=len(result["interpreted_target_changes"])-max_targets
    if remaining>0:lines.append(f"... and {remaining} more; consult the JSON audit")
    lines+=["","POSSIBLE RAMP RATE CHANGES (our decoder, NOT panel-verified)"]
    if not result["interpreted_slope_changes"]:
        lines.append("No changed slopes identified.")
    for row in result["interpreted_slope_changes"][:max_targets]:
        lines.append(
            f"Programme {row['programme']}, segment {row['segment']}: "
            f"{row['old_interpretation_rate']:g} -> "
            f"{row['new_interpretation_rate']:g} EU/time "
            f"[{row['register']}, raw {row['raw_before']} -> {row['raw_after']}]")
    if result["interpretation_warnings"]:
        lines+=["","DECODING UNCERTAINTIES"]
        lines.extend("• "+s for s in result["interpretation_warnings"])
    lines+=["","RAW REGISTER DIFFERENCES"]
    if not result["raw_differences"]:
        lines+=["None: all DA words match. This does NOT prove the programmes have "
                "the same target temperatures."]
    for row in result["raw_differences"][:max_raw]:
        lines.append(
            f"Programme {row['slot']}: {row['register']} "
            f"{row['before']} -> {row['after']}")
    remain=len(result["raw_differences"])-max_raw
    if remain>0:lines.append(f"... {remain} additional raw differences")
    lines+=["","CONCLUSION",result["warning"],
            "Compare suspect targets on the controller's own display before RUN.",
            "No USB operations or parameter writes were performed."]
    return "\n".join(lines)
