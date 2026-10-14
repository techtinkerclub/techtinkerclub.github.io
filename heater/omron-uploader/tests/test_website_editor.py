"""Static regression for the public E5CC-T programme builder.

Checks conditional website controls and syntax. No serial ports, network or
controller hardware are accessed by this test.
"""
import re, shutil, subprocess, tempfile, unittest
from pathlib import Path

PAGE=Path(__file__).resolve().parents[2]/"program-tools"/"index.html"

class WebsiteEditorTests(unittest.TestCase):
    def test_segment_input_types_and_explicit_steppers(self):
        site=PAGE.read_text(encoding="utf-8")
        self.assertIn('if(s.type!=="soak")fields.push(segmentNumber',site)
        self.assertIn('if(s.type==="ramp")fields.push(segmentNumber',site)
        self.assertIn('if(s.type==="soak")fields.push(segmentNumber',site)
        self.assertIn('data-spin="1"',site)
        self.assertIn('data-spin="-1"',site)
        self.assertIn('input.stepUp()',site)
        self.assertIn('input.stepDown()',site)
        self.assertIn('repeat(var(--seg-columns,3)',site)
    def test_planned_input_catalogue_and_warning_workflow_match_native_app(self):
        site=PAGE.read_text(encoding="utf-8")
        self.assertIn('id="sensor"',site)
        self.assertIn('id="analogueFields"',site)
        self.assertIn('id="sensorStatus"',site)
        self.assertIn("const INPUTS={",site)
        self.assertIn('29:["0–10 V"',site)
        self.assertIn("a.warnings.length",site)
        self.assertIn("selectedInput()",site)
        self.assertIn("planned_input_type:sensorPlan.code",site)
        self.assertIn("save();render();goal()",site)
        self.assertIn("Type K input 6",site)
    def test_manual_contains_interactive_model_matrix_and_transfer_sequence(self):
        root=PAGE.resolve().parents[1]
        manual=(root/"omron-programming"/"index.html").read_text(encoding="utf-8")
        operator=(root/"index.html").read_text(encoding="utf-8")
        for token in ('id="hardware-matrix"','id="demoSuffix"',
                      '0503','C3:0001–0003','Finish + Return to normal'):
            self.assertIn(token,manual)
        self.assertIn('id="software"',operator)
        self.assertIn('data-v="software"',operator)

    def test_inline_builder_javascript_is_parseable(self):
        node=shutil.which("node")
        if node is None:self.skipTest("Node is not installed on this host")
        site=PAGE.read_text(encoding="utf-8")
        scripts=re.findall(r"<script(?:\s[^>]*)?>(.*?)</script>",site,re.S|re.I)
        self.assertEqual(len(scripts),1)
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/"website_builder.js"
            path.write_text(scripts[0],encoding="utf-8")
            result=subprocess.run([node,"--check",str(path)],
                                  capture_output=True,text=True,timeout=20)
            self.assertEqual(result.returncode,0,result.stderr)
if __name__=="__main__":unittest.main()
