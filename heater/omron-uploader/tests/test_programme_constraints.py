"""Programme constraints are shared across planning, GUI and USB transfer."""
import unittest
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from programme_constraints import effective_limits,programme_issues,check_global_programming
from program_model import Programme,Segment,planned_writes,ValidationError

def setup(input_type=5,low=-200,high=1300):
    scale=1 if input_type==5 else 10
    return {"C3:0000":input_type,"C3:0004":0,
            "C3:0005":(high*scale)&0xffffffff,
            "C3:0006":(low*scale)&0xffffffff,
            "C3:00B9":0,"C3:00BA":1,"C3:00BB":0,
            "C3:00BC":0,"C3:00BD":1,"C3:00BE":0,"C3:00BF":0}

class ConstraintsTests(unittest.TestCase):
    def test_type5_accepts_600_and_rejects_fractional_target(self):
        lim=effective_limits(setup())
        p=Programme(steps=[Segment("ramp",sp="600",rate="5")])
        self.assertEqual(dict(planned_writes(0,p,input_type=5,limits=lim))[0x0017],600)
        p.steps[0].sp="600.5"
        with self.assertRaisesRegex(ValidationError,"increments"):
            planned_writes(0,p,input_type=5,limits=lim)

    def test_sensor_range_type6_enforced(self):
        lim=effective_limits(setup(6,-20,500))
        self.assertEqual((lim.minimum,lim.maximum,lim.resolution),(-20,500,0.1))
        p=Programme(steps=[Segment("ramp",sp="500.1")])
        self.assertIn("Segment 1",programme_issues(p,lim)[0])
        with self.assertRaisesRegex(ValidationError,"permitted"):
            planned_writes(0,p,input_type=6,limits=lim)
        p.steps[0].sp="-20.1"
        with self.assertRaises(ValidationError):
            p.validate(limits=lim)

    def test_controller_upper_lower_limits_beat_sensor_range(self):
        lim=effective_limits(setup(5,50,180))
        self.assertEqual((lim.minimum,lim.maximum),(50,180))
        p=Programme(steps=[Segment("ramp",sp="200")])
        issues=programme_issues(p,lim)
        self.assertIn("Segment 1",issues[0])
        self.assertIn("50…180",issues[0])
        with self.assertRaisesRegex(ValidationError,"Segment 1"):
            planned_writes(0,p,input_type=5,limits=lim)

    def test_pending_limit_change_rechecks_all_existing_segments(self):
        fields=setup(5,-200,1300)
        draft={"C3:0005":100}
        lim=effective_limits(fields,draft)
        p=Programme(steps=[Segment("ramp",sp="120"),Segment("soak",minutes="10"),
                           Segment("step",sp="150")])
        self.assertEqual(len(programme_issues(p,lim)),2)
        self.assertEqual(p.steps[0].sp,"120") # NEVER mutate stored steps
        with self.assertRaisesRegex(ValidationError,"Segment 1"):
            p.validate(limits=lim)

    def test_sensor_type_change_requires_explicit_new_sp_bounds(self):
        fields=setup(5,-200,1300)
        with self.assertRaisesRegex(ValueError,"BOTH"):
            effective_limits(fields,{"C3:0000":6})
        limits=effective_limits(fields,{"C3:0000":6,
            "C3:0005":5000,"C3:0006":0xffffff38})
        self.assertEqual((limits.minimum,limits.maximum),(-20,500))
        p=Programme(steps=[Segment("ramp",sp="650")])
        with self.assertRaisesRegex(ValidationError,"outside permitted"):
            p.validate(limits=limits)

    def test_unknown_limits_fail_closed_in_connected_transfer(self):
        with self.assertRaisesRegex(ValueError,"not read"):
            effective_limits({"C3:0000":5,"C3:0004":0},require_readback=True)
        lim=effective_limits({"C3:0000":5},require_readback=False)
        self.assertFalse(lim.verified)
        self.assertEqual(lim.maximum,1300)

    def test_invalid_bound_combinations_refused(self):
        with self.assertRaisesRegex(ValueError,"inconsistent"):
            effective_limits(setup(5,200,100))
        with self.assertRaisesRegex(ValueError,"exceed"):
            effective_limits(setup(5,-201,1300))
        with self.assertRaisesRegex(ValueError,"Unsupported"):
            effective_limits({"C3:0000":29,"C3:0005":100,"C3:0006":0})

    def test_global_programming_mode_is_checked_as_well(self):
        fields=setup()
        self.assertFalse(check_global_programming(fields))
        self.assertIn("rate-of-rise",str(check_global_programming(
            fields,{"C3:00BA":0})))
        self.assertIn("RESET",str(check_global_programming(
            fields,{"C3:00BE":1})))

if __name__=="__main__":unittest.main()
