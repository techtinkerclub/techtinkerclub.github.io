#!/usr/bin/env python3
"""Modify original D12 PowerPoint shapes in place to create D13 inspection revision.
No schematics or vector symbols are recreated. D13 remains uncommissioned.
"""
import json
import subprocess
from pathlib import Path
from pptx import Presentation
from pptx.util import Pt
from pptx.enum.text import MSO_AUTO_SIZE
import fitz

HERE=Path(__file__).resolve().parent
SOURCE=HERE.parent/"Heating_Rate_Controller_D12_Reviewed_Styled.pptx"
OUT=HERE/"Heating_Rate_Controller_D13_Styled_DRAFT.pptx"
PDF=HERE/"Heating_Rate_Controller_D13_Styled_DRAFT.pdf"
CHANGES=json.loads(r'''{"1":{"23":["Bus / jumpers TBD",11],"110":["X1: 3 outgoing L (PS1, S1-A input, S2-A input) and 3 outgoing N (PS1, E1, E2). Incoming L/N, selector outputs and PE bonds are additional wires.",10.4],"112":["SHEET 01 / 11",null],"111":["HEATING RATE CONTROLLER / D13 BLOCK + PORT SCHEMATICS / EDITABLE POWERPOINT",null]},"2":{"8":["Selector A = mains NO 13-14; B = gated +24 V NO 23-24* (IEC proposed). Per channel THREE +24 V and THREE 0 V take-off positions are reported. Approved junctions may be necessary. Verify physical contact markings and supply feeds.",11],"17":["Physical terminals/jumpers TBD",11]},"3":{"8":["Proposed K1 mode RI (upper selector); orange T timer is only used in IT. Prove OFF on supply return and held ENABLE.",10.5],"50":["A1",null],"68":["A2",null],"82":["EN1 = K1:14 / K3:A1 / SB1:LED+; SB1 COM is a different gated +24 V node.",11],"83":["X3 gated +24 -> SB1 COM, K1:A1 & 11; SB1 NO -> K1:3; EN1(K1:14) -> K3:A1 & SB1 LED+; 0 V -> K1:A2,K3:A2,SB1 LED-.",10]},"4":{"8":["Proposed K2 mode RI (upper selector); orange T timer is only used in IT. Prove OFF on supply return and held ENABLE.",10.5],"50":["A1",null],"68":["A2",null],"82":["EN2 = K2:14 / K4:A1 / SB2:LED+; SB2 COM is a different gated +24 V node.",11],"83":["X4 gated +24 -> SB2 COM, K2:A1 & 11; SB2 NO -> K2:3; EN2(K2:14) -> K4:A1 & SB2 LED+; 0 V -> K2:A2,K4:A2,SB2 LED-.",10]},"5":{"8":["ACTIVE+ shares Crydom +3 / SB1 COM gated +24 V. ENABLE LED+ instead comes from Finder K1:14 (EN1).",10.5],"34":["SB1 COM (reported)",10],"91":["W1:13 = SSR -4 & ACTIVE-  |  W1:14 = 0 V",10.5],"93":["REPORTED: Crydom +3 shares SB1 COM +24 V; ACTIVE+ also on gated +24. Crydom -4 and ACTIVE- join W1:13; W1:14 -> 0 V. Inspect terminals and junctions; load budget max 35 mA.",10]},"6":{"8":["ACTIVE+ shares Crydom +3 / SB2 COM gated +24 V. ENABLE LED+ instead comes from Finder K2:14 (EN2).",10.5],"34":["SB2 COM (verify)",10],"91":["W2:13 = SSR -4 & ACTIVE-  |  W2:14 = 0 V",10.5],"93":["PROPOSED: Crydom +3 shares SB2 COM +24 V; ACTIVE+ also on gated +24. Crydom -4 and ACTIVE- join W2:13; W2:14 -> 0 V. Independently verify CH2; max 35 mA budget.",10]},"7":{"83":["Finder 62.31 contact 14(-) and Crydom load -2 BOTH remain on switched DC POSITIVE, not DC negative. Verify 15 A contact/socket, breaker and SSR thermal ratings.",10.5]},"8":{"83":["Finder 62.31 contact 14(-) and Crydom load -2 BOTH remain on switched DC POSITIVE, not DC negative. Verify 15 A contact/socket, breaker and SSR thermal ratings.",10.5]},"9":{"8":["Cabinet TOTAL: X1 supplies 3 outgoing L and 3 outgoing N. Incoming L/N, selector-to-Omron Live wires and protective earth are ADDITIONAL.",10.7],"30":["X1:L / X1:N / PE (3 paths)",11],"32":["PS1:C1 (L) / C2 (N) / C3 (FG)",11],"36":["X1:L -> S1-A 13 -> S1-A 14",11],"38":["E1:11 (L); 2 physical wires",11],"48":["X1:L -> S2-A 13 -> S2-A 14",11],"50":["E2:11 (L); 2 physical wires",11],"87":["Verify 3 L / 3 N X1 outgoing taps, all incoming conductors, selector NO markings, PE bonding, X1-X4 terminal blocks and approved ferrules.",10.4]},"10":{"8":["K1/K2 RI step mode proposed; orange timer applies only to IT; hardware return-to-OFF is unverified.",10.3],"11":["X3/4 gated +24 -> Finder K1/2:A1 and 11; EAO SB1/2 COM. 0 V -> K1/2:A2, K3/4:A2 and ENABLE LED-.",11.5],"14":["EAO SB1/2:NO -> Finder K1/2:3; EAO COM = gated +24 V, but actual central contact marking must be checked.",11.5],"26":["Gated +24 shared at EAO COM -> Crydom +3 and ACTIVE+; Crydom -4 and ACTIVE- -> W:13; W:14 -> 0 V.",11.5],"36":["Only 3 available +24 V and 3 common 0 V take-off positions per channel reported. All junctions and real wire IDs require independent check.",10.5]},"11":{"8":["D13 remains a design/inspection draft. Verify actual parts, physical terminals and OFF after power restoration.",10.3],"42":["K1/K2: RI proposed (white selector); 0.5-20 min orange timer only for IT. Check 24 V return, dips and held ENABLE.",11.5],"45":["Check 3 L and 3 N outgoing mains taps, PSU/inlet, selectors, distribution blocks, jumpers and protective earth.",11.5],"48":["Inspect 15 A DC path: socket ratings, relay/SSR polarity, fault protection, conductor sizing and heat dissipation.",11.5],"51":["Inspect EAO COM vs LED+; Crydom+3 & ACTIVE+ = gated +24; Crydom-4 & ACTIVE- to W:13; W:14 to 0 V.",11.5],"54":["Independent checker: continuity, isolation, PE, protection, start/stop, no auto-restart; record deviations and sign off.",11.5]}}''')

def apply(shape,value,size):
    tf=shape.text_frame
    runs=[r for p in tf.paragraphs for r in p.runs]
    if runs:
        runs[0].text=value
        for r in runs[1:]:r.text=""
    else:
        tf.paragraphs[0].text=value
    if size:
        for p in tf.paragraphs:
            for r in p.runs:r.font.size=Pt(size)
    tf.auto_size=MSO_AUTO_SIZE.TEXT_TO_FIT_SHAPE

def main():
    assert SOURCE.is_file(), SOURCE
    deck=Presentation(str(SOURCE))
    assert len(deck.slides)==11
    original_ids=[[s.shape_id for s in slide.shapes] for slide in deck.slides]
    altered=[]
    for n,slide in enumerate(deck.slides,1):
        for i,s in enumerate(slide.shapes):
            if not s.has_text_frame:continue
            old=s.text
            if str(i) in CHANGES.get(str(n),{}):
                value,size=CHANGES[str(n)][str(i)]
                apply(s,value,size)
                altered.append({"slide":n,"shape_index":i,"before":old,"after":value})
            elif "D12" in old and "HEATING RATE CONTROLLER" in old:
                apply(s,old.replace("D12","D13"),None)
                altered.append({"slide":n,"shape_index":i,"before":old,"after":s.text})
    for n in (3,4):
        body=" ".join(s.text for s in deck.slides[n-1].shapes if s.has_text_frame)
        assert "L/+" not in body and "N/−" not in body, "legacy Finder terminals still present"
    deck.save(str(OUT))
    p=subprocess.run(["libreoffice","-env:UserInstallation=file:///tmp/d13originalrevision","--headless",
        "--convert-to","pdf","--outdir",str(HERE),str(OUT)],capture_output=True,text=True,timeout=150)
    assert p.returncode==0 and PDF.is_file(),p.stdout+" "+p.stderr
    final=Presentation(str(OUT))
    assert [ [s.shape_id for s in sl.shapes] for sl in final.slides]==original_ids
    pdf=fitz.open(str(PDF))
    assert len(pdf)==11
    previews=HERE/"previews";previews.mkdir(parents=True,exist_ok=True)
    for n,page in enumerate(pdf,1):
        if n in (1,2,3,4,5,6,9,10,11):
            pix=page.get_pixmap(matrix=fitz.Matrix(.85,.85),alpha=False)
            (previews/("slide-%02d.jpg"%n)).write_bytes(pix.tobytes("jpeg",jpg_quality=75))
    manifest={"source":SOURCE.name,"revision":"D13 inspection draft 22 October 2026",
        "slides":11,"original_vector_shape_counts":[len(x) for x in original_ids],
        "modified_text_shapes":len(altered),"changes":altered,
        "hold_points":["Finder 13.61 output OFF after power restoration not tested",
        "EAO central pushbutton contact not confirmed as COM","Control distribution terminal capacities and incoming connections unknown","Mains/PE and DC power paths require independent inspection"]}
    (HERE/"slide_inventory.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding="utf8")
    print("D13 ISSUED using all original PPTX vector shapes: ",len(altered),"revisions")
if __name__=="__main__":main()
