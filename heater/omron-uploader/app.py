"""E5CC-T Programme Studio — offline Windows GUI, Tkinter + PySerial.
The controller uploader is deliberately gated for isolated laboratory validation.
"""
from __future__ import annotations
import argparse, json, queue, threading, os, sys, traceback
from pathlib import Path
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
from program_model import Programme,Segment,ValidationError,blank_programme,TARGET_MODEL
from transfer import TransferSession,PreflightError,PREFLIGHT
from compoway import SerialClient
from offline_creator import open_studio
from controller_setup import (CONFIG, BY_CODE, read_snapshot, validate_snapshot, value_text,
                              apply_draft, build_proposal, report as setup_report,
                              write_new_json)
from backup_explorer import load_backup, decode_slot, profile_points, config_explanation, summary_as_plaintext, DecodeError

BLUE="#1966a3";BG="#eef3f8";DARK="#1b344d";RED="#b43e45";GREEN="#287953"
INK="#162d45";PALE="#e4eff9";BORDER="#d6e3ed";WHITE="#ffffff"
APP_TITLE="E5CC-T Programme Studio · Offline + USB"

class Window:
 def __init__(self,root,lab_mode=False):
    self.root=root;self.lab_mode=lab_mode;self.progs=[blank_programme() for _ in range(8)];self.progs[0]=Programme()
    for i in range(1,8):self.progs[i].name=f"Programme {i}"
    self.slot=tk.IntVar(value=0);self.current_segment=None;self.client=None;self.session=None;self.busy=False
    self.events=queue.Queue();self.connected=False;self.fail_latched=False
    self._auto_backup=False;self._auto_show_explorer=False
    root.title(APP_TITLE);root.geometry("1370x890");root.minsize(1090,720);root.configure(bg=BG)
    style=ttk.Style();style.theme_use("clam")
    style.configure("TNotebook",background=BG,borderwidth=0)
    style.configure("TNotebook.Tab",font=("Segoe UI",10,"bold"),padding=(17,12),
                    background="#dfe9f2",foreground="#506f88",borderwidth=0)
    style.map("TNotebook.Tab",
              background=[("selected",WHITE),("active","#f5f9fc")],
              foreground=[("selected",BLUE),("active",INK)])
    style.configure("TButton",padding=(12,8),font=("Segoe UI",10),
                    background="#e4f0f8",foreground="#1d577f",
                    borderwidth=1,relief="flat")
    style.map("TButton",background=[("active","#d0e5f4"),("disabled","#eff3f7")])
    style.configure("Primary.TButton",padding=(14,10),font=("Segoe UI",10,"bold"),
                    background=BLUE,foreground=WHITE,borderwidth=0,relief="flat")
    style.map("Primary.TButton",background=[("active","#0d507f"),("disabled","#9eb7c9")],
              foreground=[("disabled","#f2f4f6")])
    style.configure("TFrame",background=BG)
    style.configure("TLabel",background=BG,foreground=DARK,font=("Segoe UI",10))
    style.configure("Title.TLabel",background=BG,font=("Segoe UI",17,"bold"),foreground=DARK)
    style.configure("Treeview",background=WHITE,fieldbackground=WHITE,
                    foreground=INK,rowheight=30,relief="flat",borderwidth=0,
                    font=("Segoe UI",10))
    style.configure("Treeview.Heading",font=("Segoe UI",10,"bold"),
                    background="#edf4fa",foreground="#345976",padding=(8,10))
    style.map("Treeview",background=[("selected","#d8ebfa")],
              foreground=[("selected",INK)])
    hero=tk.Frame(root,bg="#193951",padx=20,pady=14);hero.pack(fill="x")
    lefthead=tk.Frame(hero,bg="#193951");lefthead.pack(side="left",fill="x",expand=True)
    tk.Label(lefthead,text="E5CC-T   /   PROGRAMME STUDIO",bg="#193951",fg=WHITE,
             anchor="w",font=("Segoe UI",19,"bold")).pack(anchor="w")
    tk.Label(lefthead,text="Design offline   •   Practice keypad   •   Inspect USB   •   Back up memory",
             bg="#193951",fg="#bad4e8",font=("Segoe UI",10)).pack(anchor="w",pady=(3,0))
    mode="ISOLATED LAB MODE" if lab_mode else "READ-ONLY SERIAL MODE"
    tk.Label(hero,text=mode,bg="#315c72" if lab_mode else "#255e65",
             fg="#f0fafb",padx=13,pady=9,font=("Segoe UI",10,"bold")).pack(side="right")
    actions=tk.Frame(root,bg=BG,padx=18,pady=9);actions.pack(fill="x")
    self.b(actions,"DESIGN A PROGRAMME  ↗",self.open_offline_creator,True).pack(side="left",padx=(0,9))
    self.b(actions,"Manual-entry sheet",self.entry_sheet).pack(side="left",padx=(0,9))
    tk.Label(actions,text="ONE controller connected at a time",
             bg=BG,fg="#627d92",font=("Segoe UI",10)).pack(side="right")
    self.book=ttk.Notebook(root);self.book.pack(expand=True,fill="both",padx=18,pady=(4,8))
    self.t_web=ttk.Frame(self.book);self.t_builder=ttk.Frame(self.book)
    self.t_connect=ttk.Frame(self.book);self.t_backup=ttk.Frame(self.book)
    self.t_explore=ttk.Frame(self.book);self.t_setup=ttk.Frame(self.book)
    self.t_upload=ttk.Frame(self.book);self.t_audit=ttk.Frame(self.book)
    for tab,title in [(self.t_web,"START"),
                      (self.t_builder,"EDIT"),
                      (self.t_connect,"CONNECT"),
                      (self.t_backup,"BACK UP"),
                      (self.t_explore,"EXPLORE"),
                      (self.t_setup,"SETUP"),
                      (self.t_upload,"UPLOAD"),
                      (self.t_audit,"LOG")]:
        self.book.add(tab,text=title)
    self._web_studio();self._builder();self._connect();self._backup();self._explorer();self._setup();self._upload();self._audit()
    self.status=tk.StringVar(value="Ready · offline planning; controller not connected")
    footer=tk.Frame(root,bg=WHITE,padx=19,pady=10);footer.pack(fill="x",side="bottom")
    tk.Label(footer,text="STATUS",bg=WHITE,fg="#6b879c",
             font=("Segoe UI",9,"bold")).pack(side="left",padx=(0,12))
    tk.Label(footer,textvariable=self.status,bg=WHITE,fg=INK,
             font=("Segoe UI",10)).pack(side="left")
    self.log("Started in "+("LAB TRANSFER ENABLED" if lab_mode else "READ-ONLY")+" mode")
    if not lab_mode:self.log("No hardware writes available. Run with --enable-lab-writes to unlock separate physical safety workflow.")
    self._refresh_programme();self.refresh_ports();self.refresh_buttons()
    self.root.after(100,self._pump)
    self.root.protocol("WM_DELETE_WINDOW",self.exit)

 def _web_studio(self):
    """Task-oriented start screen. The rich browser creator is launched from here."""
    root=tk.Frame(self.t_web,bg=BG,padx=20,pady=20)
    root.pack(fill="both",expand=True)
    header=tk.Frame(root,bg=WHITE,padx=25,pady=21,highlightbackground=BORDER,highlightthickness=1)
    header.pack(fill="x")
    tk.Label(header,text="WORKFLOW  /  E5CC-T",bg=WHITE,fg=BLUE,
             font=("Segoe UI",10,"bold")).pack(anchor="w")
    tk.Label(header,text="One controller. One clear workflow.",bg=WHITE,fg=INK,
             font=("Segoe UI",21,"bold")).pack(anchor="w",pady=(3,7))
    tk.Label(header,text="Design offline or connect your E58-CIFQ2 cable to inspect, save and safely review existing controller data. "
             "All USB reads work without an internet connection.",bg=WHITE,fg="#4d718c",
             wraplength=980,justify="left",font=("Segoe UI",11)).pack(anchor="w")
    steps=tk.Frame(root,bg=BG)
    steps.pack(fill="both",expand=True,pady=(16,0))
    for col in range(2):steps.grid_columnconfigure(col,weight=1,uniform="workflow")
    for row in range(2):steps.grid_rowconfigure(row,weight=1)
    def tile(pos,title,subtitle,body,button,fn,primary=False):
        row,col=divmod(pos,2)
        pane=tk.Frame(steps,bg=WHITE,padx=24,pady=19,
                      highlightbackground=BORDER,highlightthickness=1)
        pane.grid(row=row,column=col,sticky="nsew",padx=(0,9) if col==0 else (9,0),pady=(0,15))
        tk.Label(pane,text=subtitle,bg=WHITE,fg=BLUE,font=("Segoe UI",9,"bold")).pack(anchor="w")
        tk.Label(pane,text=title,bg=WHITE,fg=INK,font=("Segoe UI",16,"bold")).pack(anchor="w",pady=(4,9))
        tk.Label(pane,text=body,bg=WHITE,fg="#526f84",justify="left",
                 wraplength=460,font=("Segoe UI",10)).pack(anchor="w",pady=(0,15))
        self.b(pane,button,fn,primary).pack(anchor="w")
    tile(0,"Build a heating programme","STEP 01  ·  NO CABLE REQUIRED",
         "Open the full graphical programme designer and keypad simulator. You can work without connecting a controller.",
         "OPEN PROGRAMME DESIGNER ↗",self.open_offline_creator,True)
    tile(1,"Connect and read everything","STEP 02  ·  READ-ONLY USB",
         "With heater supplies isolated, choose the COM port on Connect. Read the controller's identity and create a verified backup of its eight programme memories.",
         "GO TO CONNECTION",lambda:self.book.select(self.t_connect),True)
    tile(2,"Review what's already stored","STEP 03  ·  HUMAN-READABLE",
         "Browse all eight programme slots with ramps, soaks, steps and charts. Import a stored programme into the editor without writing to hardware.",
         "EXPLORE EXISTING PROGRAMMES",lambda:self.book.select(self.t_explore))
    tile(3,"Preview a controlled transfer","STEP 04  ·  ISOLATED LAB ONLY",
         "Compare the intended changes with the saved original registers. Only an explicitly enabled lab session can stage changes, verify them and save separately.",
         "REVIEW UPLOAD WORKFLOW",lambda:self.book.select(self.t_upload))
    self.home_note=tk.StringVar(value="READY  •  No controller connected  •  No hardware writes")
    tk.Label(root,textvariable=self.home_note,bg=PALE,fg=INK,padx=15,pady=13,
             font=("Segoe UI",10,"bold"),anchor="w").pack(fill="x")
 def open_offline_creator(self):
    try:
        path,opened=open_studio()
        self.status.set("Offline website creator: "+str(path))
        self.log("Opened bundled website Programme Studio (no serial activity): "+str(path))
        if not opened:
            messagebox.showinfo("Offline creator ready",
                "The creator is available as this local HTML file:\n"+str(path)+
                "\n\nOpen it in Edge or Chrome if your browser did not launch automatically.")
    except Exception as err:
        messagebox.showerror("Offline creator could not open",str(err))

 def load_bench_example(self):
    slot=self.slot.get()
    if not messagebox.askyesno("Load verified 50 °C example",
        f"Replace local editor programme {slot} with the 50 °C at 2 °C/min ramp "
        "and 15-minute soak? This does NOT change the physical Omron."):
        return
    self.progs[slot]=Programme(name="Verified 50°C ramp + 15-minute soak",
        start="20",finish="rst",steps=[
            Segment("ramp",sp="50",rate="2"),
            Segment("soak",minutes="15")
        ])
    self._refresh_programme()
    self.log(f"Loaded 50 °C example in LOCAL memory {slot}; no controller write")

 def card(self,parent,heading):
    outer=tk.Frame(parent,bg="white",bd=1,relief="solid",highlightthickness=0)
    tk.Label(outer,text=heading,anchor="w",font=("Segoe UI",12,"bold"),fg=DARK,bg="white",pady=10,padx=12).pack(fill="x")
    body=tk.Frame(outer,bg="white",padx=12,pady=8);body.pack(expand=True,fill="both")
    return outer,body
 def b(self,par,text,command,primary=False):
    return ttk.Button(par,text=text,command=command,style="Primary.TButton" if primary else "TButton")
 def field(self,par,label,var,width=18):
    f=tk.Frame(par,bg="white");tk.Label(f,text=label,bg="white",fg="#4b6882",anchor="w").pack(anchor="w")
    ent=ttk.Entry(f,textvariable=var,width=width);ent.pack(fill="x",pady=(2,9));return f,ent
 def message(self,par,text,color="#526e85"):
    tk.Label(par,text=text,anchor="w",justify="left",wraplength=480,fg=color,bg="white",font=("Segoe UI",9)).pack(anchor="w",fill="x",pady=5)
 def _builder(self):
    self.t_builder.columnconfigure(0,weight=5);self.t_builder.columnconfigure(1,weight=3);self.t_builder.rowconfigure(0,weight=1)
    left=tk.Frame(self.t_builder,bg=BG);left.grid(row=0,column=0,sticky="nsew",padx=(0,8));left.rowconfigure(1,weight=1);left.columnconfigure(0,weight=1)
    right=tk.Frame(self.t_builder,bg=BG);right.grid(row=0,column=1,sticky="nsew");right.rowconfigure(0,weight=1);right.columnconfigure(0,weight=1)
    panel,body=self.card(left,"Local programme memory and starting conditions");panel.grid(row=0,column=0,sticky="ew",pady=(0,9))
    row=tk.Frame(body,bg="white");row.pack(fill="x")
    tk.Label(row,text="Memory:",bg="white").pack(side="left")
    self.slot_box=ttk.Combobox(row,values=[str(i) for i in range(8)],textvariable=self.slot,width=4,state="readonly");self.slot_box.pack(side="left",padx=7);self.slot_box.bind("<<ComboboxSelected>>",lambda e:self._refresh_programme())
    self.name=tk.StringVar();self.start=tk.StringVar();self.finish=tk.StringVar()
    x,ent=self.field(body,"Description",self.name);x.pack(fill="x");ent.bind("<FocusOut>",lambda e:self._store_meta())
    small=tk.Frame(body,bg="white");small.pack(fill="x")
    x,ent=self.field(small,"Assumed starting PV (°C)",self.start);x.pack(side="left",fill="x",expand=True,padx=(0,6));ent.bind("<FocusOut>",lambda e:self._store_meta())
    tk.Label(small,text="End: RESET (required for uploads)",bg="white",fg="#6a7e91").pack(side="left",padx=8)
    panel,body=self.card(left,"Segments · select a row to edit");panel.grid(row=1,column=0,sticky="nsew");body.rowconfigure(0,weight=1);body.columnconfigure(0,weight=1)
    self.tree=ttk.Treeview(body,columns=("type","target","rate","hold"),show="headings",height=9,selectmode="browse");self.tree.grid(row=0,column=0,sticky="nsew")
    for c,t,w in [("type","Type",92),("target","Target °C",92),("rate","Rate °C/min",116),("hold","Hold min",95)]:self.tree.heading(c,text=t);self.tree.column(c,width=w,anchor="center")
    sc=ttk.Scrollbar(body,orient="vertical",command=self.tree.yview);sc.grid(row=0,column=1,sticky="ns");self.tree.configure(yscrollcommand=sc.set)
    self.tree.bind("<<TreeviewSelect>>",lambda e:self._edit_selected())
    actions=tk.Frame(body,bg="white");actions.grid(row=1,column=0,columnspan=2,sticky="ew",pady=9)
    for title,fn in [("+ Ramp",lambda:self.add("ramp")),("+ Soak",lambda:self.add("soak")),("+ Step",lambda:self.add("step"))]:self.b(actions,title,fn).pack(side="left",padx=3,pady=2)
    actions2=tk.Frame(body,bg="white");actions2.grid(row=2,column=0,columnspan=2,sticky="ew",pady=3)
    for title,fn in [("Move ↑",lambda:self.move(-1)),("Move ↓",lambda:self.move(1)),("Remove selected",self.remove)]:self.b(actions2,title,fn).pack(side="left",padx=3,pady=2)
    editor=tk.Frame(body,bg="#f0f7fc",padx=9,pady=8);editor.grid(row=3,column=0,columnspan=2,sticky="ew");self.editor_label=tk.Label(editor,text="Select segment to edit",bg="#f0f7fc",fg=DARK,font=("Segoe UI",10,"bold"));self.editor_label.grid(row=0,column=0,columnspan=3,sticky="w")
    self.kind=tk.StringVar();self.sp=tk.StringVar();self.rate=tk.StringVar();self.minutes=tk.StringVar()
    edf=[]
    for idx,(title,v) in enumerate([("Type",self.kind),("Target °C",self.sp),("Slope /min",self.rate),("Soak min",self.minutes)]):
        tk.Label(editor,text=title,bg="#f0f7fc",font=("Segoe UI",9)).grid(row=1,column=idx,sticky="w",padx=4)
        if idx==0:
            z=ttk.Combobox(editor,textvariable=v,values=["ramp","soak","step"],state="readonly",width=10)
        else:z=ttk.Entry(editor,textvariable=v,width=13)
        z.grid(row=2,column=idx,sticky="ew",padx=4,pady=4);edf.append(z)
    editor.columnconfigure(1,weight=1);self.b(editor,"Apply segment change",self.apply_segment,True).grid(row=3,column=0,columnspan=4,sticky="e",pady=5)
    side,body=self.card(right,"Commanded setpoint (not measured PV)");side.grid(row=0,column=0,sticky="new")
    self.canvas=tk.Canvas(body,bg="white",height=235,highlightthickness=0);self.canvas.pack(fill="both",expand=False)
    self.canvas.bind("<Configure>",lambda event:self.update_chart())
    self.summary=tk.StringVar();tk.Label(body,textvariable=self.summary,bg="white",fg=BLUE,font=("Segoe UI",10,"bold"),wraplength=385).pack(fill="x",pady=10)
    self.valid=tk.StringVar();self.valid_label=tk.Label(body,textvariable=self.valid,bg="white",fg=GREEN,wraplength=340,justify="left");self.valid_label.pack(fill="x")
    r=tk.Frame(body,bg="white");r.pack(fill="x",pady=14)
    self.b(r,"Open website JSON",self.import_program).pack(side="left",padx=3)
    self.b(r,"Save programme JSON",self.export_program).pack(side="left",padx=3)
    r2=tk.Frame(body,bg="white");r2.pack(fill="x",pady=4)
    self.b(r2,"Print entry sheet",self.entry_sheet).pack(side="left",padx=3)
    self.b(r2,"Save all 8",self.save_project).pack(side="left",padx=3)
    self.b(r2,"Open project",self.open_project).pack(side="left",padx=3)
    r3=tk.Frame(body,bg=WHITE);r3.pack(fill="x",pady=7)
    self.b(r3,"Load verified 50 °C example",self.load_bench_example).pack(side="left",padx=3)
    self.b(r3,"Full offline website creator  ↗",self.open_offline_creator,True).pack(side="left",padx=3)
    self.message(body,"This desktop editor works without a controller. Import or export website programme JSON here, or use the first tab for the full interactive website generator and keypad simulator.")

 def _store_meta(self):
    p=self.progs[self.slot.get()];p.name=self.name.get();p.start=self.start.get();p.finish="rst";self.update_chart()
 def _refresh_programme(self):
    p=self.progs[self.slot.get()];self.name.set(p.name);self.start.set(p.start);self.finish.set("rst")
    self.tree.delete(*self.tree.get_children())
    for i,s in enumerate(p.steps):self.tree.insert("", "end", iid=str(i),values=(s.type,s.sp if s.type!="soak" else "—",s.rate if s.type=="ramp" else "—",s.minutes if s.type=="soak" else "—"))
    if p.steps:self.tree.selection_set("0");self._edit_selected()
    else:self.current_segment=None
    self.update_chart();self.refresh_buttons()
 def _edit_selected(self):
    sel=self.tree.selection();
    if not sel:return
    i=int(sel[0]);p=self.progs[self.slot.get()]
    if i>=len(p.steps):return
    self.current_segment=i;s=p.steps[i];self.editor_label.configure(text=f"Editing segment {i}")
    self.kind.set(s.type);self.sp.set(s.sp);self.rate.set(s.rate);self.minutes.set(s.minutes)
 def apply_segment(self):
    if self.current_segment is None:return
    p=self.progs[self.slot.get()];i=self.current_segment
    previous=p.steps[i];p.steps[i]=Segment(self.kind.get(),self.sp.get(),self.rate.get(),self.minutes.get())
    try:p.validate()
    except ValidationError as e:p.steps[i]=previous;messagebox.showerror("Parameter rejected",str(e));return
    self._refresh_programme();self.tree.selection_set(str(i));self._edit_selected()
 def add(self,kind):
    self._store_meta();p=self.progs[self.slot.get()]
    if len(p.steps)>=32:messagebox.showwarning("Limit", "Omron allows 32 segments per programme");return
    p.steps.append(Segment(kind));self._refresh_programme();i=len(p.steps)-1;self.tree.selection_set(str(i));self.tree.see(str(i));self._edit_selected()
 def move(self,d):
    i=self.current_segment;p=self.progs[self.slot.get()]
    if i is None or not 0<=i+d<len(p.steps):return
    p.steps[i],p.steps[i+d]=p.steps[i+d],p.steps[i];self._refresh_programme();self.tree.selection_set(str(i+d));self._edit_selected()
 def remove(self):
    i=self.current_segment;p=self.progs[self.slot.get()]
    if i is None:return
    if len(p.steps)==1:messagebox.showwarning("Required", "Keep at least one segment");return
    p.steps.pop(i);self._refresh_programme()
 def update_chart(self):
    p=self.progs[self.slot.get()];self.canvas.delete("all")
    try:
        a=p.validate();points=a["points"];total=max(1,a["minutes"]);ys=[pt[1] for pt in points];lo=min(ys);hi=max(ys)
        if hi==lo:lo-=5;hi+=5
        dy=hi-lo;hi+=dy*.10;lo-=dy*.10
        xright=max(170,min(402,self.canvas.winfo_width()-16))
        def coord(t,y):return (42+(t/total)*(xright-42),196-(y-lo)/(hi-lo)*166)
        for k in range(5):
            y=30+k*(166/4);self.canvas.create_line(42,y,xright,y,fill="#e1eaf2");self.canvas.create_text(32,y,text=f"{hi-(hi-lo)*k/4:.0f}°",anchor="e",fill="#658097",font=("Segoe UI",8))
        xy=[]
        for t,y in points:xy.extend(coord(t,y))
        if len(xy)>=4:self.canvas.create_line(*xy,fill="#1e80b7",width=3)
        else:self.canvas.create_oval(xy[0]-3,xy[1]-3,xy[0]+3,xy[1]+3,fill=BLUE)
        self.canvas.create_text(45,215,text="0",anchor="w",fill="#688197")
        self.canvas.create_text(xright,215,text=f"{a['minutes']:.1f} min",anchor="e",fill="#688197")
        self.summary.set(f"{len(p.steps)} segments · {a['minutes']:.2f} min nominal · Final SP {a['final_sp']:.1f} °C")
        self.valid.set("Model constraints passed. Still requires preflight / safety review.");self.valid_label.configure(fg=GREEN)
    except ValidationError as err:self.summary.set("Programme incomplete");self.valid.set(str(err));self.valid_label.configure(fg=RED)
    self.refresh_buttons()
 def import_program(self):
    path=filedialog.askopenfilename(filetypes=[("Programme JSON","*.json")]);
    if not path:return
    try:
        obj=json.loads(Path(path).read_text(encoding="utf-8"))
        if obj.get("schema")=="e5cct-backup-1":raise ValueError("This file is a controller backup, not a programme")
        if obj.get("method") not in (None,"rate","rate-of-rise"):raise ValueError("Unsupported programme method")
        p=Programme.from_json(obj);slot=int(obj.get("programmeNumber",self.slot.get()))
        if not 0<=slot<=7:raise ValueError("Invalid programme slot")
        self.progs[slot]=p;self.slot.set(slot);self._refresh_programme();self.log("Imported generator JSON from "+path)
    except Exception as e:messagebox.showerror("Import failed",str(e))
 def export_program(self):
    self._store_meta();p=self.progs[self.slot.get()]
    try:p.validate()
    except ValidationError as e:messagebox.showerror("Invalid programme",str(e));return
    path=filedialog.asksaveasfilename(defaultextension=".json",initialfile=f"E5CC-T-programme-{self.slot.get()}.json",filetypes=[("JSON","*.json")]);
    if path:
        Path(path).write_text(json.dumps({"version":1,"method":"rate","programmeNumber":self.slot.get(),"programme":p.as_json()},indent=2,ensure_ascii=False),encoding="utf-8");self.log("Exported programme: "+path)

 def save_project(self):
    self._store_meta()
    try:
        for i,p in enumerate(self.progs):p.validate()
    except ValidationError as err:messagebox.showerror("Project invalid",f"Programme {i}: {err}");return
    path=filedialog.asksaveasfilename(defaultextension=".json",initialfile="E5CC-T-8-programme-project.json",filetypes=[("JSON","*.json")])
    if path:
        payload={"schema":"e5cct-project-1","model":TARGET_MODEL,"method":"rate","selected":self.slot.get(),"programmes":[p.as_json() for p in self.progs]}
        Path(path).write_text(json.dumps(payload,indent=2,ensure_ascii=False),encoding="utf-8")
        self.log("Saved 8-programme design project: "+path)
 def open_project(self):
    path=filedialog.askopenfilename(filetypes=[("JSON","*.json")]);
    if not path:return
    try:
        obj=json.loads(Path(path).read_text(encoding="utf-8"))
        if obj.get("schema")!="e5cct-project-1" or obj.get("model")!=TARGET_MODEL or obj.get("method")!="rate":raise ValueError("Not a compatible E5CC-T design project")
        if len(obj["programmes"])!=8:raise ValueError("Project requires exactly eight programmes")
        new=[Programme.from_json(x) for x in obj["programmes"]]
        if not messagebox.askyesno("Replace local project?", "Open project and replace all 8 unsaved local programmes?"):return
        self.progs=new;self.slot.set(int(obj.get("selected",0)));self._refresh_programme();self.log("Opened project: "+path)
    except Exception as err:messagebox.showerror("Could not open project",str(err))

 def entry_sheet(self):
    """Create a practical stand-alone manual programming sheet, no cable needed."""
    import html,webbrowser
    self._store_meta()
    p=self.progs[self.slot.get()]
    try:metrics=p.validate()
    except ValidationError as err:
        messagebox.showerror("Programme needs attention",str(err));return
    slot=self.slot.get()
    rows=[("d.prg",str(slot)),("s-no",str(len(p.steps)))]
    for i,seg in enumerate(p.steps):
        styp="soak" if seg.type=="soak" else "ramp"
        rows.extend([("d.seg",str(i)),("styp",styp)])
        if seg.type!="soak":
            rows.append(("sp",f"{float(seg.sp):g} °C"))
            rows.append(("pr","0 °C/min (instant SP step)" if seg.type=="step"
                        else str(seg.rate)+" °C/min"))
        else:
            n=int(seg.minutes)
            rows.append(("time",f"{n//60}.{n%60:02d} (hours.minutes)"))
    rows.extend([("d.seg","end (programme-wide)"),
                 ("pid","check actual selected PID set; bench value was 1"),
                 ("al-1 / al-2 / al-3","inspect, do not alter without wiring review"),
                 ("rpt","0 (do not repeat)"),("link","end (do not chain)"),
                 ("LEVEL","short ×3 from Programme Level to Operation Level"),
                 ("prg",f"{slot} — select programme to RUN (not d.prg)"),
                 ("pgsg",f"confirm programme {slot} in monitor"),
                 ("r-r","rst before starting or saving")])
    cells="".join("<tr><td><code>"+html.escape(k)+"</code></td><td>"+
                  html.escape(v)+"</td></tr>" for k,v in rows)
    description=html.escape(p.name)
    start=html.escape(str(p.start))
    content=f"""<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
    <title>Omron programme {slot} — manual entry</title>
    <style>body{{font:14px/1.6 'Segoe UI',Arial,sans-serif;background:#f0f4f8;color:#1c344a;max-width:860px;margin:25px auto;padding:0 18px}}
    .paper{{background:white;padding:25px 32px;border-radius:14px;border:1px solid #d9e6ef}}
    h1{{margin:0;color:#155783}}h2{{margin-top:27px;color:#195e90}}
    .over{{text-transform:uppercase;letter-spacing:1px;color:#567c99;font-size:11px;font-weight:700}}
    p{{margin:9px 0}}table{{border-collapse:collapse;width:100%;margin-top:10px}}
    td,th{{padding:10px;border-bottom:1px solid #dae5ee;text-align:left}}
    th{{background:#eaf3fa}}td:first-child{{width:34%}}
    .note{{border-left:4px solid #2692ba;background:#edf7fc;padding:10px 15px;margin:17px 0}}
    .warn{{border-left:4px solid #c7933b;background:#fff7e7;padding:10px 15px;margin:17px 0}}
    @media print{{body{{background:white;margin:0}}.paper{{border:0;padding:0}}}}</style></head>
    <body><main class="paper"><p class="over">E5CC-T · portable studio · offline keypad guide</p>
    <h1>Programme {slot}: {description}</h1>
    <p>{len(p.steps)} segments · assumed start PV {start} °C · nominal {metrics['minutes']:.1f} min · commanded final SP {metrics['final_sp']:g} °C</p>
    <div class="warn"><strong>Controller mains and heater DC must be physically isolated during configuration.</strong>
    This sheet documents programmed setpoints; it cannot establish measured heating or electrical safety.
    Confirm the unit's full suffix and settings before use.</div>
    <h2>1 · Check existing setup, do not force changes</h2>
    <p>Rate method <code>t-pr = pr</code>; <code>pru = m</code> (°C per minute);
    <code>t-u = h-m</code> (hours.minutes); <code>rtsm = stop</code>;
    <code>p-on = rst</code>; <code>eset = rst</code>; programmed setpoint <code>spmd = psp</code>.
    The first real unit reported <code>in-t = 5</code> (valid Type K, whole-degree display)
    and <code>PV/SP Start = 0</code> (SP Start). These are NOT automatically faults;
    do not change them merely to satisfy a provisional uploader rule.</p>
    <h2>2 · Enter programme values, using real display codes</h2>
    <p>From PV/SP, briefly press <strong>LEVEL</strong> once to get <code>d.prg</code>.
    Set memory {slot}. Press <strong>MODE</strong> to step through the following parameter
    screens; use UP/DOWN to change values and PF for digit editing where supported.
    A segment automatically advances to the next <code>d.seg</code> after its last parameter.
    A soak uses <code>time</code> but no separate SP. <code>d.seg = end</code> means programme-wide settings.</p>
    <table><thead><tr><th>Omron display</th><th>Value / check</th></tr></thead><tbody>{cells}</tbody></table>
    <h2>3 · Save and select for execution</h2>
    <p>There is no dedicated Save key for ordinary front-panel editing.
    Return to Operation Level, revisit <code>d.prg</code>, and read every segment back.
    With power safely isolated, verify that settings survive a complete controller
    power cycle before use. In <strong>Operation Level</strong>, select <code>prg = {slot}</code>
    separately — this is the programme that would RUN, whereas <code>d.prg</code>
    only chooses which memory you edit. Verify the <code>pgsg</code> monitor and
    <code>r-r = rst</code>.</p>
    <div class="note">For deeper instructions, use the <strong>Offline Programme Studio</strong>
    and its five-button simulator bundled with this Windows application.</div>
    <p>Controller ID: ____________________ &nbsp; Date: ___________ &nbsp; Checked by: ____________________</p>
    </main></body></html>"""
    path=filedialog.asksaveasfilename(defaultextension=".html",
        initialfile=f"E5CC-T-entry-sheet-{slot}.html",
        filetypes=[("HTML","*.html")])
    if path:
        Path(path).write_text(content,encoding="utf-8")
        self.log("Created offline front-panel entry sheet: "+path)
        if messagebox.askyesno("Open manual entry sheet",
             "Open the saved sheet in your browser for printing?"):
            webbrowser.open(Path(path).resolve().as_uri())

 def _connect(self):
    panel,body=self.card(self.t_connect,"Connection wizard — read-only");panel.pack(fill="x",padx=10,pady=10)
    self.message(body,"One controller per USB session. 1. Isolate controller mains and external heater DC. 2. Connect E58-CIFQ2. 3. Select a COM port (e.g. COM7). 4. Read identity, operating status and nine C3 fields. This is read-only; no process-output control.")
    row=tk.Frame(body,bg="white");row.pack(fill="x",pady=10)
    tk.Label(row,text="COM port",bg="white").pack(side="left")
    self.port=tk.StringVar();self.portbox=ttk.Combobox(row,textvariable=self.port,width=40);self.portbox.pack(side="left",padx=9)
    self.b(row,"Refresh",self.refresh_ports).pack(side="left")
    self.btn_connect=self.b(row,"CONNECT + INSPECT",self.inspect,True);self.btn_connect.pack(side="left",padx=9)
    self.btn_disconnect=self.b(row,"Disconnect",self.disconnect);self.btn_disconnect.pack(side="left")
    self.btn_quick=self.b(body,"CONNECT + AUTOMATICALLY BACK UP ALL 8 PROGRAMMES",self.quick_scan)
    self.btn_quick.pack(anchor="w",pady=(0,7))
    self.message(body,"Recommended shortcut: connect, inspect and save a read-only backup in one guided action. The original memories are not modified.")
    self.inspecttext=scrolledtext.ScrolledText(body,height=13,wrap="word",font=("Consolas",10));self.inspecttext.pack(fill="both",expand=True)
    self.inspecttext.insert("end","No controller connected.\nModel identification is only 10 characters: the full -000 suffix must be confirmed on the nameplate.\n")
    self.message(body,"This bench build expects the observed Type K input 5 (whole degrees) and SP Start 0. Any configuration change blocks lab transfer. Keep the heater isolated; a successful communications write is not approval to energise it.")
 def refresh_ports(self):
    try:
        from serial.tools import list_ports
        ports=[x.device for x in list_ports.comports()]
        self.portbox["values"]=ports
        if ports and not self.port.get():self.port.set(ports[0])
    except ImportError:self.portbox["values"]=[];self.status.set("PySerial missing — Windows portable package should include it")
 def quick_scan(self):
    if self.busy or self.client:return
    self._auto_backup=True
    self.inspect()
 def inspect(self):
    if self.client or self.busy:return
    port=self.port.get().strip()
    if not port:messagebox.showwarning("No COM port", "Select a COM port");return
    def work():
        client=SerialClient(port,write_allowed=self.lab_mode)
        session=TransferSession(client,emit=self.log)
        try: result=session.preflight()
        except Exception:
            client.close();raise
        return(client,session,result)
    def success(result):
        self.client,self.session,info=result;self.connected=True;self.fail_latched=False
        self.inspecttext.delete("1.0","end")
        self.inspecttext.insert("end",f"CONNECTED: {port}\nModel prefix: {info['model10']}\nStatus: {info['status']}\n\n")
        for addr,(wanted,note) in PREFLIGHT.items():
            got=info["settings"][f"C3:{addr:04X}"]
            self.inspecttext.insert("end",f"C3:{addr:04X}  actual {got} / provisional upload gate {wanted}   {note}\n")
        self.inspecttext.insert("end","\nNEXT: Back up all 8 programme blocks before considering any write.\n")
        if info["mismatches"]:self.inspecttext.insert("end","\nUPLOAD BLOCKED: old preflight assumptions need correction, not necessarily the controller. USB read and backup remain allowed.\n")
        self.book.select(self.t_backup);self.refresh_buttons()
        self.home_note.set(f"CONNECTED  •  {info['model10']} on {port}  •  Read-only status checked")
        if self._auto_backup:
            self._auto_backup=False
            self._auto_show_explorer=True
            self.backup()
    self._job("Read-only identification/preflight",work,success)
 def disconnect(self):
    if self.busy:return
    if self.session and self.session.ram_touched and not self.session.committed:
        if not messagebox.askyesno("Uncommitted RAM settings", "Staged RAM changes have NOT been saved. Keep the heater isolated. Are you sure you want to disconnect?"):return
    if self.client:
        try:self.client.close()
        except Exception:pass
    self.client=None;self.session=None;self.connected=False;self.fail_latched=False;self.status.set("Disconnected")
    self.home_note.set("DISCONNECTED  •  Offline editing available  •  No controller writes")
    self._auto_backup=False;self._auto_show_explorer=False
    for v in self.check_vars:v.set(False)
    self.confirm.set("")
    self.log("Disconnected (no controller operation command issued)");self.refresh_buttons()

 def _backup(self):
    panel,body=self.card(self.t_backup,"Mandatory backup of existing controller programme memory");panel.pack(fill="both",expand=True,padx=10,pady=10)
    self.message(body,"Read every DA register in the eight programme blocks (8 × 150). The resulting JSON also includes the 9 checked C3 initial configuration parameters. This is NOT a complete clone of every controller setting, and it is NOT a verified restoration utility.")
    self.message(body,"This app connects to ONE controller at a time. Keep each controller backup in its own folder or filename, away from the app. Backing up does not authorise an upload.")
    self.backdir=tk.StringVar(value=str(Path.home()/"Documents"/"Omron E5CC-T Backups"))
    row=tk.Frame(body,bg="white");row.pack(fill="x",pady=7)
    ttk.Entry(row,textvariable=self.backdir).pack(side="left",expand=True,fill="x")
    self.b(row,"Folder…",self.pick_dir).pack(side="left",padx=6)
    self.btn_backup=self.b(body,"READ AND SAVE ALL PROGRAMME MEMORY (no writes)",self.backup,True);self.btn_backup.pack(anchor="w",pady=10)
    self.back_progress=tk.IntVar(value=0)
    ttk.Progressbar(body,maximum=8,mode="determinate",variable=self.back_progress).pack(fill="x",pady=(2,7))
    self.backupdetail=tk.StringVar(value="Not backed up in this session — 0/8 programme blocks")
    tk.Label(body,textvariable=self.backupdetail,bg="white",fg=DARK,justify="left",wraplength=850).pack(fill="x",pady=11)
    self.b(body,"VERIFY SAVED PROGRAMME AFTER USB POWER CYCLE (read only)",self.verify_receipt).pack(anchor="w",pady=10)
    self.message(body,"A failed read invalidates the backup: transfers stay blocked. If a controller has previously been configured by CX-Thermo, this is how we capture what is already on it before changing anything.")
 def pick_dir(self):
    x=filedialog.askdirectory();
    if x:self.backdir.set(x)
 def backup(self):
    if not self.session:return
    self.back_progress.set(0)
    self.backupdetail.set("Reading programme memories — 0 of 8 complete (read-only)")
    def work():
        return self.session.backup(self.backdir.get(),progress=lambda done,total:self.events.put(("BACKUP_PROGRESS",(done,total))))
    def success(path):
        count=sum(len(block) for block in self.session.backup_data["programmes"].values())
        self.back_progress.set(8)
        # Populate Controller Explorer automatically without leaving the backup page.
        if self.session.backup_data:
            self.explorer_load(self.session.backup_data,"Verified current backup: "+str(path))
            self.book.select(self.t_backup)
        self.home_note.set(f"BACKUP COMPLETE  •  {count} DA registers saved  •  Controller unchanged")
        self.backupdetail.set(
            f"✓ SAVED FILE VERIFIED — 8/8 programme blocks, {count} DA registers, 9 C3 settings.\n"
            f"Location: {path}\n"
            "READ-ONLY: no controller writes performed."
        )
        self.status.set("SUCCESS — eight programmes backed up; saved JSON reopened and checked")
        self.log(f"BACKUP COMPLETE — 8/8 programmes, {count} registers and 9 C3 values; verified disk file: {path}")
        # Continue directly to the Explorer only when the quick scan was requested.
        if self._auto_show_explorer:
            self._auto_show_explorer=False
            self.book.select(self.t_explore)
        else:
            self.book.select(self.t_backup)
        self.refresh_buttons()
        messagebox.showinfo(
            "Backup complete — file checked",
            f"All eight programme areas were read successfully.\n"
            f"{count} DA registers and 9 selected C3 values captured.\n\n"
            f"The JSON file was reopened and matched the data read during this session.\n"
            f"Location:\n{path}\n\n"
            "No controller settings were written.\n"
            "This is not a complete controller clone or an independent second controller read.\n"
            "Keep a second copy of this JSON file."
        )
    self._job("Reading 8 programmes (1200 registers)",work,success)

 def verify_receipt(self):
    if not self.session or self.busy:
        messagebox.showwarning("Connect first", "Reconnect using E58-CIFQ2 and identify the controller first.");return
    if not messagebox.askyesno("Persistence check", "This comparison is meaningful only AFTER the Omron has lost USB setup power and been reconnected.\n\nHave you physically unplugged/replugged the setup cable while heater power is isolated?"):
        return
    file=filedialog.askopenfilename(title="Choose saved upload receipt",filetypes=[("JSON","*.json")])
    if not file:return
    self._job("Read-only persistence verification",lambda:self.session.verify_persistence(file),lambda path:messagebox.showinfo("Persistence compared", "Read-back matches receipt after your reported power cycle. Verification: "+str(path)))

 def _explorer(self):
    """Presentation-only inspector. Never changes a controller or raw backup."""
    self.explorer_backup=None
    self.explorer_source=""
    root=tk.Frame(self.t_explore,bg=BG,padx=13,pady=13)
    root.pack(fill="both",expand=True)
    head=tk.Frame(root,bg=WHITE,padx=16,pady=13,
                  highlightthickness=1,highlightbackground=BORDER)
    head.pack(fill="x",pady=(0,11))
    tk.Label(head,text="CONTROLLER EXPLORER   /   READ ONLY",
             bg=WHITE,fg=BLUE,font=("Segoe UI",10,"bold")).pack(anchor="w")
    tk.Label(head,text="What's already stored in this Omron?",
             bg=WHITE,fg=INK,font=("Segoe UI",18,"bold")).pack(anchor="w",pady=(5,3))
    tk.Label(head,text="Understand all eight programme memories without deciphering hexadecimal registers. "
             "Read from the current session's backup or open a saved JSON file, even without a cable. "
             "The graphs are estimated SETPOINT curves, never measured temperatures.",
             bg=WHITE,fg="#557389",wraplength=1060,justify="left").pack(anchor="w",pady=(1,8))
    row=tk.Frame(head,bg=WHITE);row.pack(fill="x",pady=(5,0))
    self.b(row,"Open a controller backup JSON",self.explorer_open,True).pack(side="left",padx=(0,9))
    self.b(row,"Use current session backup",self.explorer_current).pack(side="left",padx=(0,9))
    self.b(row,"Copy selected to local editor",self.explorer_copy).pack(side="left",padx=(0,9))
    self.b(row,"Save human-readable report",self.explorer_export).pack(side="left",padx=(0,9))
    self.explorer_status=tk.StringVar(value="No backup loaded · Back up an Omron or open a previous backup file")
    tk.Label(root,textvariable=self.explorer_status,bg=BG,fg="#52728b",
             justify="left",anchor="w",wraplength=1070).pack(fill="x",pady=(0,11))
    content=tk.Frame(root,bg=BG);content.pack(fill="both",expand=True)
    content.columnconfigure(0,weight=1);content.columnconfigure(1,weight=2)
    content.rowconfigure(0,weight=1)
    left,body=self.card(content,"Saved programme memories (0–7)")
    left.grid(row=0,column=0,sticky="nsew",padx=(0,10))
    body.columnconfigure(0,weight=1)
    body.rowconfigure(0,weight=1)
    self.explorer_list=ttk.Treeview(body,columns=("n","segments","profile"),
        show="headings",height=8,selectmode="browse")
    for col,label,width in [("n","Slot",48),("segments","Segments",75),("profile","What it does",260)]:
        self.explorer_list.heading(col,text=label)
        self.explorer_list.column(col,width=width,anchor="w",stretch=(col=="profile"))
    self.explorer_list.grid(row=0,column=0,sticky="nsew")
    exscroll=ttk.Scrollbar(body,orient="vertical",command=self.explorer_list.yview)
    exscroll.grid(row=0,column=1,sticky="ns")
    self.explorer_list.configure(yscrollcommand=exscroll.set)
    self.explorer_list.bind("<<TreeviewSelect>>",lambda _event:self.explorer_select())
    self.explorer_start=tk.StringVar(value="20")
    startrow=tk.Frame(body,bg=WHITE);startrow.grid(row=1,column=0,columnspan=2,sticky="ew",pady=8)
    tk.Label(startrow,text="Assumed starting PV (°C)",bg=WHITE,fg="#547188").pack(side="left",padx=(0,8))
    ttk.Entry(startrow,textvariable=self.explorer_start,width=9).pack(side="left")
    self.b(startrow,"Update curve",self.explorer_select).pack(side="left",padx=6)
    tk.Label(body,text="The real start temperature isn't stored in a rate-mode profile.",
             bg=WHITE,fg="#617c8d",wraplength=330,justify="left").grid(row=2,column=0,columnspan=2,sticky="w")
    right=tk.Frame(content,bg=BG);right.grid(row=0,column=1,sticky="nsew")
    right.rowconfigure(0,weight=2);right.rowconfigure(1,weight=3)
    right.columnconfigure(0,weight=1)
    upper,ubody=self.card(right,"Commanded setpoint · reconstructed from memory")
    upper.grid(row=0,column=0,sticky="nsew",pady=(0,10))
    self.explorer_canvas=tk.Canvas(ubody,bg=WHITE,height=225,highlightthickness=0)
    self.explorer_canvas.pack(fill="both",expand=True)
    self.explorer_canvas.bind("<Configure>",lambda _event:self.explorer_plot())
    lower,lbody=self.card(right,"Plain-English programme explanation")
    lower.grid(row=1,column=0,sticky="nsew")
    self.explorer_text=scrolledtext.ScrolledText(lbody,height=12,wrap="word",
        bg="#f9fcff",fg=INK,font=("Segoe UI",10),bd=0,padx=12,pady=10)
    self.explorer_text.pack(fill="both",expand=True)
    self.explorer_text.insert("1.0","Load a controller backup to view each stored programme, "
        "the nine decoded controller configuration fields and any interpretation warnings.")
    self.explorer_text.config(state="disabled")

 def explorer_open(self):
    path=filedialog.askopenfilename(title="Open read-only controller memory backup",
        filetypes=[("E5CC-T backup JSON","*.json"),("All files","*.*")])
    if not path:return
    try:
        backup=load_backup(path)
        self.explorer_load(backup,"Saved file: "+path)
    except (OSError,ValueError,TypeError,KeyError) as err:
        messagebox.showerror("Cannot interpret backup",str(err))

 def explorer_current(self):
    if not self.session or not self.session.backup_data:
        messagebox.showinfo("No current backup","Complete Step 4 Memory backup first, "
                            "or open an existing backup JSON file. No serial commands were sent.")
        return
    self.explorer_load(self.session.backup_data,
                       "Current read-only session: "+str(self.session.backup_file or "memory"))

 def explorer_load(self,backup,source):
    self.explorer_backup=backup
    self.explorer_source=source
    self.explorer_list.delete(*self.explorer_list.get_children())
    for slot in range(8):
        info=decode_slot(backup,slot)
        preview=(info["segments"][0]["description"] if info["segments"]
                 else "No active profile decoded")
        if len(preview)>57:preview=preview[:54]+"…"
        self.explorer_list.insert("","end",iid=str(slot),
             values=(slot,info["count"],preview))
    self.explorer_status.set("READ ONLY · "+source+"  •  8 programme blocks available")
    self.explorer_list.selection_set("0")
    self.explorer_select()
    self.book.select(self.t_explore)

 def explorer_selected(self):
    selected=self.explorer_list.selection()
    if not selected or self.explorer_backup is None:return None
    return decode_slot(self.explorer_backup,int(selected[0]))

 def explorer_select(self):
    info=self.explorer_selected()
    if info is None:return
    try:
        assumed=float(self.explorer_start.get())
        points=profile_points(info,assumed)
        report=summary_as_plaintext(info,assumed)
    except (ValueError,TypeError) as err:
        points=None
        report=summary_as_plaintext(info,20)+"\n\nInvalid assumed PV: "+str(err)
    config=config_explanation(self.explorer_backup)
    report+="\n\nCONTROLLER-WIDE SETTINGS FROM THIS BACKUP:\n"
    for c in config:
        report+=f"  • {c['name']}: {c['meaning']} (raw {c['raw']})\n"
    report+="\nREMEMBER: A downloaded/loaded memory is NOT a live PV trace.\n"
    self.explorer_text.config(state="normal")
    self.explorer_text.delete("1.0","end")
    self.explorer_text.insert("1.0",report)
    self.explorer_text.config(state="disabled")
    self.explorer_plot(points)

 def explorer_plot(self,points=None):
    canvas=self.explorer_canvas
    if not canvas or not canvas.winfo_exists():return
    canvas.delete("all")
    info=self.explorer_selected()
    if info is None:
        canvas.create_text(50,45,text="Open a backup to see a programme",anchor="w",fill="#617b92")
        return
    if points is None:
        try:points=profile_points(info,float(self.explorer_start.get()))
        except (ValueError,TypeError):points=None
    if not points:
        canvas.create_text(34,38,text="Profile cannot be drawn reliably from these settings",
                           anchor="w",fill="#a5643e",font=("Segoe UI",10,"bold"))
        canvas.create_text(34,62,text="Check the warning list and verify the raw parameter values.",
                           anchor="w",fill="#667c91")
        return
    width=max(380,canvas.winfo_width())
    height=max(210,canvas.winfo_height())
    left,top,right,bottom=58,24,width-23,height-37
    values=[y for _,y in points]
    lo,hi=min(values),max(values)
    if hi==lo:lo-=5;hi+=5
    spread=hi-lo;lo-=spread*.12;hi+=spread*.12
    max_t=max(1.,points[-1][0])
    def xy(t,y):return(left+(t/max_t)*(right-left),
                       bottom-((y-lo)/(hi-lo))*(bottom-top))
    for k in range(5):
        y=top+(bottom-top)*k/4
        canvas.create_line(left,y,right,y,fill="#e3ecf4",width=1)
        canvas.create_text(left-9,y,text=f"{hi-(hi-lo)*k/4:g}°",
                           anchor="e",fill="#6a8598",font=("Segoe UI",9))
    coords=[]
    for t,temp in points:
        x,y=xy(t,temp)
        coords.extend((x,y))
        canvas.create_oval(x-3,y-3,x+3,y+3,fill=BLUE,outline=WHITE)
    if len(coords)>=4:
        canvas.create_line(*coords,fill="#187ab6",width=3)
    canvas.create_text(left,bottom+18,text="0 min",anchor="w",fill="#647e91")
    canvas.create_text(right,bottom+18,text=f"{points[-1][0]:.1f} min",
                       anchor="e",fill="#647e91")
    canvas.create_text(right,top-9,text="SV ONLY  /  NOT MEASURED PV",
                       anchor="e",fill="#687d92",font=("Segoe UI",9,"bold"))

 def explorer_copy(self):
    info=self.explorer_selected()
    if info is None:
        messagebox.showinfo("Select programme","Open a controller backup and select a memory first.")
        return
    # Never pretend a partial or unknown decode can be converted to a writable design.
    if info["warnings"] or not info["segments"] or any(s["type"]=="unknown" for s in info["segments"]):
        messagebox.showwarning("Interpretation needs checking",
            "This memory has unknown or unsupported values. Inspect the raw backup and "
            "front-panel programme before copying it to an editable design.")
        return
    if info["repeat"]!=0 or info["link"]!=-1:
        messagebox.showwarning("Nonstandard repeat / chaining",
            "The local editor does not model repetitions or programme chaining. "
            "Do not discard these settings silently.")
        return
    from program_model import Segment,Programme
    steps=[]
    for section in info["segments"]:
        if section["type"]=="ramp":
            if section["sp"] is None or section["rate"] is None:
                messagebox.showwarning("Incomplete ramp","Cannot safely interpret SP/rate.");return
            if section["rate"]==0:
                steps.append(Segment("step",sp=str(section["sp"])))
            else:
                steps.append(Segment("ramp",sp=str(section["sp"]),
                                     rate=str(section["rate"])))
        elif section["type"]=="step" and section["sp"] is not None:
            steps.append(Segment("step",sp=str(section["sp"])))
        elif section["type"]=="soak" and section["minutes"] is not None:
            steps.append(Segment("soak",minutes=str(section["minutes"])))
        else:
            messagebox.showwarning("Unknown segment","Inspect raw memory first.");return
    try:
        candidate=Programme(name=f"Copy of controller memory {info['slot']} (offline)",
            start=self.explorer_start.get(),finish="rst",steps=steps)
        candidate.validate()
    except (ValueError,TypeError) as err:
        messagebox.showwarning("Editor cannot represent this programme",str(err));return
    slot=info["slot"]
    if not messagebox.askyesno("Copy to LOCAL editor only",
       f"Replace the unsaved local designer memory {slot} with this decoded copy?\n"
       "This does not edit controller memory or upload anything.\n\n"
       "Verify SP scaling and all parameters on the real Omron before using an upload."):
        return
    self.progs[slot]=candidate
    self.slot.set(slot)
    self._refresh_programme()
    self.book.select(self.t_builder)
    self.log(f"Copied decoded memory {slot} to offline native editor ONLY; no controller writes")

 def explorer_export(self):
    info=self.explorer_selected()
    if info is None:return
    report=self.explorer_text.get("1.0","end").strip()
    target=filedialog.asksaveasfilename(defaultextension=".txt",
        initialfile=f"E5CC-T-memory-{info['slot']}-explanation.txt",
        filetypes=[("Text report","*.txt")])
    if target:
        Path(target).write_text(report,encoding="utf-8")
        self.log("Saved read-only human-language profile description: "+target)


 def _setup(self):
    """Read actual device settings and prepare a separate OFFLINE draft; no serial writes."""
    self.setup_snapshot=None
    self.setup_draft={}
    self.setup_choices={}
    panel,body=self.card(self.t_setup,"Controller setup — read, understand, compare")
    panel.pack(fill="both",expand=True,padx=10,pady=10)
    tk.Label(body,text="LIVE CONTROLLER READS / OFFLINE PLANNING — NO HARDWARE SETUP WRITES",
             bg="#eef5fc",fg="#1b557c",font=("Segoe UI",10,"bold"),padx=10,pady=8).pack(fill="x")
    self.message(body,"Read the existing controller configuration over E58-CIFQ2, or open a previously saved snapshot. Values are shown in plain language, beside their Omron menu abbreviations and raw register addresses. Changing a proposed value changes ONLY the local draft.")
    self.message(body,"Selected high-value settings, NOT a full controller clone. Alarm thresholds, all PID sets, auxiliary output assignments and other advanced/protect parameters still need a wider read-only audit.")
    buttons=tk.Frame(body,bg="white");buttons.pack(fill="x",pady=(9,6))
    self.btn_setup_read=self.b(buttons,"READ CONTROLLER SETTINGS (no writes)",self.setup_read,True)
    self.btn_setup_read.pack(side="left",padx=(0,6))
    self.b(buttons,"Open saved snapshot…",self.setup_open).pack(side="left",padx=4)
    self.b(buttons,"Save actual snapshot…",self.setup_save_snapshot).pack(side="left",padx=4)
    self.b(buttons,"Export comparison…",self.setup_export).pack(side="left",padx=4)
    self.b(buttons,"Clear proposed changes",self.setup_clear).pack(side="left",padx=4)
    self.setup_summary=tk.StringVar(value="No setup snapshot loaded. Connect and click READ, or open a saved setup snapshot.")
    tk.Label(body,textvariable=self.setup_summary,bg="white",fg="#365d79",justify="left",
             wraplength=1000).pack(fill="x",pady=7)
    content=tk.Frame(body,bg="white");content.pack(fill="both",expand=True,pady=7)
    table_frame=tk.Frame(content,bg="white");table_frame.pack(side="left",fill="both",expand=True)
    self.setup_tree=ttk.Treeview(table_frame,columns=("group","parameter","actual","proposed"),show="headings",selectmode="browse")
    for name,heading,width in [("group","Group",140),("parameter","Controller setting",225),("actual","Read from controller",280),("proposed","Proposed OFFLINE change",265)]:
        self.setup_tree.heading(name,text=heading);self.setup_tree.column(name,width=width,stretch=True)
    self.setup_tree.pack(side="left",fill="both",expand=True)
    sc=ttk.Scrollbar(table_frame,orient="vertical",command=self.setup_tree.yview)
    sc.pack(side="right",fill="y");self.setup_tree.configure(yscrollcommand=sc.set)
    self.setup_tree.bind("<<TreeviewSelect>>",lambda _:self.setup_select())
    editor=tk.Frame(content,bg="#f2f7fb",padx=13,pady=13,width=285)
    editor.pack(side="right",fill="y",padx=(9,0));editor.pack_propagate(False)
    tk.Label(editor,text="SELECTED SETTING",bg="#f2f7fb",fg=BLUE,font=("Segoe UI",10,"bold")).pack(anchor="w")
    self.setup_info=tk.StringVar(value="Select a row to see its purpose and available offline choices.")
    tk.Label(editor,textvariable=self.setup_info,bg="#f2f7fb",fg=INK,wraplength=255,
             justify="left").pack(anchor="w",pady=(10,14))
    tk.Label(editor,text="PROPOSE A CHANGE (OFFLINE ONLY)",bg="#f2f7fb",fg=BLUE,
             font=("Segoe UI",9,"bold")).pack(anchor="w")
    self.setup_choice=tk.StringVar()
    self.setup_box=ttk.Combobox(editor,textvariable=self.setup_choice,state="disabled",width=35)
    self.setup_box.pack(fill="x",pady=9)
    self.b(editor,"Add to proposed changes",self.setup_apply).pack(anchor="w",pady=8)
    tk.Label(editor,text="This screen NEVER sends a setting change to the controller. A proposal must be validated, then programmed and independently verified in a separate approved procedure.",
             bg="#f2f7fb",fg=RED,wraplength=255,justify="left").pack(anchor="w",pady=15)
 def setup_read(self):
    if not self.session or self.busy:
        messagebox.showwarning("Connect first","Identify a controller on the USB inspect tab before reading setup.")
        return
    def work():
        # Re-read ALL selected C3/C1 settings, and compare the original nine
        # against inspection time. Unsupported settings become explicit 'Not read' rows.
        return read_snapshot(self.client,self.session.info,self.session.settings)
    def done(snapshot):
        self.setup_load(snapshot,"Live read (one attached controller)")
        self.book.select(self.t_setup)
        unavailable=len(snapshot["errors"])
        changed=len(snapshot.get("changed_since_inspection",{}))
        self.log(f"SETUP READ ONLY: {sum(v is not None for v in snapshot['fields'].values())} fresh register reads; {unavailable} unavailable; {changed} changed since inspection; zero writes")
        messagebox.showinfo("Controller configuration read",
                            f"Read {sum(v is not None for v in snapshot['fields'].values())} selected settings.\n"
                            f"{unavailable} optional settings unavailable.\n"
                            f"{changed} settings changed since initial inspection.\n\n"
                            "Save this setup snapshot as well as the separate eight-programme backup.\n"
                            "No values were changed on the Omron.")
    self._job("Read controller setup registers (read only)",work,done)
 def setup_open(self):
    filename=filedialog.askopenfilename(title="Open controller setup snapshot",filetypes=[("E5CC setup JSON","*.json")])
    if not filename:return
    try:
        snapshot=json.loads(Path(filename).read_text(encoding="utf-8"))
        validate_snapshot(snapshot)
        self.setup_load(snapshot,"Saved file: "+str(filename))
    except (OSError,ValueError,TypeError,KeyError) as exc:
        messagebox.showerror("Cannot open snapshot",str(exc))
 def setup_load(self,snapshot,source):
    validate_snapshot(snapshot)
    self.setup_snapshot=snapshot
    self.setup_draft={}
    self.setup_summary.set(f"{source} · {snapshot['controller']['model10']} · "
                           f"{sum(v is not None for v in snapshot['fields'].values())} selected settings read · "
                           f"{len(snapshot.get('errors',{}))} unavailable · "
                           f"{len(snapshot.get('changed_since_inspection',{}))} changed since connection · "
                           "0 proposed changes · NEVER WRITTEN")
    self.setup_refresh()
 def setup_refresh(self):
    selection=self.setup_tree.selection()
    selected=selection[0] if selection else None
    for row in self.setup_tree.get_children():self.setup_tree.delete(row)
    if self.setup_snapshot:
        fields=self.setup_snapshot["fields"]
        for p in CONFIG:
            code=p["code"];raw=fields.get(code)
            actual=value_text(code,raw)
            if raw is not None: actual=f"{actual}   [{raw:08X}]"
            proposed=p["options"][self.setup_draft[code]] if code in self.setup_draft else "—"
            self.setup_tree.insert("", "end",iid=code,values=(p["group"],p["name"],actual,proposed))
    if selected in self.setup_tree.get_children():self.setup_tree.selection_set(selected)
    self.setup_select()
 def setup_select(self):
    selected=self.setup_tree.selection()
    if not selected or not self.setup_snapshot:
        self.setup_info.set("Select a setting to review it.")
        self.setup_box.config(state="disabled",values=[])
        self.setup_choice.set("")
        return
    code=selected[0];p=BY_CODE[code]
    raw=self.setup_snapshot["fields"].get(code)
    self.setup_info.set(f"{p['name']} ({p['menu']})\n{code}\n\n"
                        f"Actual: {value_text(code,raw)}\n\n{p['explanation']}")
    if p["options"] and raw is not None:
        self.setup_choices={f"{i}: {meaning}":i for i,meaning in p["options"].items()}
        self.setup_box.config(state="readonly",values=list(self.setup_choices))
        proposed=self.setup_draft.get(code)
        choice=next((k for k,v in self.setup_choices.items() if v==proposed),"")
        self.setup_choice.set(choice)
    else:
        self.setup_choices={}
        self.setup_box.config(state="disabled",values=[])
        self.setup_choice.set("")
 def setup_apply(self):
    selected=self.setup_tree.selection()
    if not selected or not self.setup_snapshot:return
    code=selected[0]
    value=self.setup_choices.get(self.setup_choice.get())
    try:self.setup_draft=apply_draft(self.setup_snapshot,self.setup_draft,code,value)
    except ValueError as exc:
        messagebox.showwarning("Invalid offline proposal",str(exc));return
    self.setup_summary.set(f"Loaded configuration: {self.setup_snapshot['controller']['model10']} · "
                           f"{len(self.setup_draft)} UNSAVED OFFLINE PROPOSED CHANGES · hardware untouched")
    self.setup_refresh()
 def setup_clear(self):
    self.setup_draft={}
    if self.setup_snapshot:
        self.setup_summary.set(f"Snapshot {self.setup_snapshot['controller']['model10']} · "
                               "all proposed changes cleared · no hardware writes")
    self.setup_refresh()
 def setup_save_snapshot(self):
    if not self.setup_snapshot:
        messagebox.showwarning("Read first","Read or open a real setup snapshot before saving.");return
    filename=filedialog.asksaveasfilename(title="Save unmodified controller setup snapshot",
                                          defaultextension=".json",
                                          initialfile="E5CC-T-controller-setup-snapshot.json",
                                          filetypes=[("JSON","*.json")])
    if not filename:return
    try:
        write_new_json(filename,self.setup_snapshot)
        self.log("Saved unmodified read-only setup snapshot: "+filename)
        messagebox.showinfo("Snapshot saved","Saved and verified the unmodified configuration snapshot. No controller changes.")
    except (OSError,ValueError) as exc:messagebox.showerror("Not saved",str(exc)+"\nOriginal snapshots are never overwritten.")
 def setup_export(self):
    if not self.setup_snapshot:
        messagebox.showwarning("Read first","Load a setup snapshot before exporting.");return
    try:
        proposal=build_proposal(self.setup_snapshot,self.setup_draft)
        content=setup_report(self.setup_snapshot,self.setup_draft)
    except (ValueError,KeyError) as exc:
        messagebox.showerror("Invalid proposal",str(exc));return
    filename=filedialog.asksaveasfilename(title="Save OFFLINE configuration proposal",
                                          defaultextension=".json",
                                          initialfile="E5CC-T-OFFLINE-setup-proposal.json",
                                          filetypes=[("JSON","*.json")])
    if not filename:return
    try:
        write_new_json(filename,proposal)
        textpath=Path(filename).with_suffix(".txt")
        with textpath.open("x",encoding="utf-8") as handle:handle.write(content)
        self.log(f"Exported OFFLINE configuration comparison ({len(proposal['proposed_changes'])} proposals): {filename}")
        messagebox.showinfo("Offline comparison exported",
                            f"{len(proposal['proposed_changes'])} changes PROPOSED, not applied.\n"
                            f"JSON: {filename}\nText report: {textpath}\n\nNo controller writes.")
    except (OSError,ValueError) as exc:messagebox.showerror("Export incomplete",str(exc))

 def _upload(self):
    panel,body=self.card(self.t_upload,"Controlled RAM upload — isolated hardware bench only");panel.pack(fill="both",expand=True,padx=10,pady=10)
    self.lab_info=tk.StringVar(value="WRITE MODE LOCKED" if not self.lab_mode else "LAB TRANSFER MODE ENABLED — strict safety checks still required")
    tk.Label(body,textvariable=self.lab_info,bg="#fff4e6",fg="#8e461c",font=("Segoe UI",11,"bold"),padx=10,pady=8).pack(fill="x")
    self.message(body,"A transfer changes only the selected DA programme block (segment count, segment types, active SP/rates/times, repetition=0, link=none). It deliberately NEVER edits the sensor type, PID, alarms, control output, START/RUN state, or firmware. End behaviour must already be set to RESET.")
    self.channel=tk.StringVar(value="Bench controller")
    row=tk.Frame(body,bg="white");row.pack(anchor="w",pady=8)
    ttk.Label(row,text="Connected controller ID (audit label):").pack(side="left")
    ttk.Entry(row,textvariable=self.channel,width=32).pack(side="left",padx=8)
    self.check_vars=[]
    checks=[
        "The controller is physically isolated from mains and external DC heater supply.",
        "I have confirmed the FULL E5CC-TQX3A5M-000 on the side nameplate.",
        "I have read the preflight checks and confirmed the controller is in RESET.",
        "I have saved the session backup in a secure location.",
        "I understand RAM staging changes the controller temporarily; SAVE RAM DATA is a separate operation.",
        "This is an isolated commissioning exercise, NOT permission to energise the heater.",
    ]
    for c in checks:
        v=tk.BooleanVar(value=False);self.check_vars.append(v)
        cb=tk.Checkbutton(body,text=c,variable=v,bg="white",anchor="w",justify="left",wraplength=820,command=self.refresh_buttons)
        cb.pack(fill="x",anchor="w",pady=3)
    self.confirm=tk.StringVar();r=tk.Frame(body,bg="white");r.pack(fill="x",pady=9)
    tk.Label(r,text="Type AUTHORISE LAB TRANSFER:",bg="white",fg=DARK).pack(side="left")
    ttk.Entry(r,textvariable=self.confirm,width=27).pack(side="left",padx=10)
    self.confirm.trace_add("write",lambda *_:self.refresh_buttons())
    self.transfer_summary=tk.StringVar(value="Select a programme in Builder. No upload plan prepared.")
    tk.Label(body,textvariable=self.transfer_summary,bg="white",fg=DARK,wraplength=850,justify="left").pack(fill="x",pady=8)
    controls=tk.Frame(body,bg="white");controls.pack(fill="x",pady=6)
    self.btn_preview=self.b(controls,"Preview exact register changes",self.preview);self.btn_preview.pack(side="left",padx=3)
    self.btn_stage=self.b(controls,"1 · STAGE & VERIFY IN RAM",self.stage,True);self.btn_stage.pack(side="left",padx=3)
    self.btn_commit=self.b(controls,"2 · EXPLICIT SAVE TO CONTROLLER",self.commit);self.btn_commit.pack(side="left",padx=3)
    self.message(body,"EXPERIMENTAL, ISOLATED LAB ONLY. Register encoder supports the observed input type 5/whole-degree SP values, but this version has NOT yet completed a hardware write qualification. Start with a disposable test slot and inspect every changed register. No heater or SSR power. On a communications fault, stop; no automatic rollback or save.",RED)
 def safe_to_stage(self):
    return self.lab_mode and self.connected and self.session is not None and self.session.backup_data is not None and not self.fail_latched and not self.busy and all(x.get() for x in self.check_vars) and self.confirm.get()=="AUTHORISE LAB TRANSFER" and self.session.staged is None and not self.session.mismatches and str(self.session.status).startswith("01")
 def refresh_buttons(self):
    if not hasattr(self,"btn_stage"):return
    self.btn_connect.config(state="normal" if not self.busy and not self.client else "disabled")
    self.btn_quick.config(state="normal" if not self.busy and not self.client else "disabled")
    self.btn_disconnect.config(state="normal" if not self.busy and self.client else "disabled")
    self.btn_backup.config(state="normal" if self.connected and not self.busy and not self.fail_latched else "disabled")
    self.btn_setup_read.config(state="normal" if self.connected and not self.busy else "disabled")
    self.btn_preview.config(state="normal" if self.connected and self.session.backup_data and not self.busy else "disabled")
    self.btn_stage.config(state="normal" if self.safe_to_stage() else "disabled")
    self.btn_commit.config(state="normal" if self.lab_mode and not self.busy and not self.fail_latched and self.session and self.session.staged and not self.session.committed else "disabled")
 def preview(self):
    self._store_meta()
    try:
        self.progs[self.slot.get()].validate();changes=self.session.build_plan(self.slot.get(),self.progs[self.slot.get()])
        self.transfer_summary.set(f"{self.channel.get()}: programme {self.slot.get()} · {len(changes)} changes out of {len(self.progs[self.slot.get()].steps)} active segments. No writes performed.")
        preview="\n".join(f"DA:{a:04X}   {o:08X} → {n:08X}" for a,o,n in changes)
        self.log("Read-only planned changes:\n"+preview)
        messagebox.showinfo("Preview (read only)", f"{len(changes)} changed registers for programme {self.slot.get()}\n\n"+preview[:3500])
    except Exception as e:messagebox.showerror("Cannot build transfer plan",str(e))
 def stage(self):
    if not self.safe_to_stage():return
    self._store_meta();s=self.slot.get();p=self.progs[s]
    try:changes=self.session.build_plan(s,p)
    except Exception as e:messagebox.showerror("Cannot stage",str(e));return
    if not changes:
        messagebox.showinfo("Already matches", "Target programme already matches the backed-up registers. No write needed.");return
    if not messagebox.askyesno("LAST CHECK BEFORE WRITING RAM",f"Controller: {self.session.info['model10']} (prefix)\n{self.channel.get()} · programme {s}\n{len(changes)} registers will be WRITTEN TO CONTROLLER RAM.\n\nNormal controller supply AND DC heater power must be physically disconnected.\nProceed with RAM STAGING only?"):return
    self._job("Staging programme to controller RAM",lambda:self.session.stage(s,p),lambda out:self._staged_success(out),write=True)
 def _staged_success(self,out):
    self.transfer_summary.set(f"RAM verified: {len(out['changes'])} register differences. Nonvolatile memory NOT saved yet. Review values before committing.")
    self.refresh_buttons();self.log("Pending explicit Save RAM Data")
 def commit(self):
    if not(self.lab_mode and self.session and self.session.staged and not self.session.committed and not self.fail_latched and not self.busy):return
    if not messagebox.askyesno("FINAL NONVOLATILE SAVE", "This sends Omron SAVE RAM DATA, writing ALL currently pending operation/adjustment/programme/PID RAM changes to nonvolatile controller memory — not only the selected programme.\n\nOnly proceed after reviewing the RAM-verified values and with all heaters isolated.\n\nSAVE now?"):return
    self._job("Explicit Save RAM Data",lambda:self.session.commit(),lambda receipt:self._commit_success(receipt),write=True)
 def _commit_success(self,receipt):
    self.transfer_summary.set("Saved and immediate read-back verified. RECEIPT: "+str(receipt)+". Reconnect after power cycle and verify persistence; keep heater isolated.")
    self.log("COMMITTED. Channel label: "+self.channel.get());self.refresh_buttons()

 def _audit(self):
    panel,body=self.card(self.t_audit,"Action log · save your commissioning evidence");panel.pack(fill="both",expand=True,padx=10,pady=10)
    self.output=scrolledtext.ScrolledText(body,height=20,font=("Consolas",10),wrap="word");self.output.pack(fill="both",expand=True)
    row=tk.Frame(body,bg="white");row.pack(anchor="w",pady=8)
    self.b(row,"Export log",self.save_log).pack(side="left")
    self.b(row,"Open Omron H186 manual",lambda:self.open_url("https://files.omron.eu/downloads/latest/manual/en/h186_e5_c-t_digital_temperature_controllers_communications_manual_en.pdf")).pack(side="left",padx=8)
    self.message(body,"Workflow: design offline → inspect identity and configuration → read-only programme backup → review every planned register change → supervised RAM stage → separate nonvolatile save → reread → manual keypad verification → independent electrical commissioning. No real-time process monitor is provided for -000. Do not enable writes until input scaling and PV/SP Start assumptions are reviewed.")
 def save_log(self):
    path=filedialog.asksaveasfilename(defaultextension=".txt",initialfile="E5CC-T-transfer-log.txt")
    if path:Path(path).write_text(self.output.get("1.0","end"),encoding="utf-8")
 def open_url(self,url):import webbrowser;webbrowser.open(url)
 def log(self,msg):
    from datetime import datetime
    stamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    self.events.put(("LOG",stamp+"  "+str(msg)))
 def _job(self,label,fn,success,write=False):
    if self.busy:return
    self.busy=True;self.status.set("Working: "+label);self.refresh_buttons();self.log("BEGIN: "+label)
    def run():
        try:self.events.put(("DONE",(label,fn(),success)))
        except Exception as err:self.events.put(("ERROR",(label,str(err),write,traceback.format_exc())))
    threading.Thread(target=run,daemon=True).start()
 def _pump(self):
    try:
        while True:
            event,payload=self.events.get_nowait()
            if event=="LOG":
                if hasattr(self,"output"):self.output.insert("end",payload+"\n");self.output.see("end")
            elif event=="BACKUP_PROGRESS":
                completed,total=payload
                self.back_progress.set(completed)
                self.backupdetail.set(f"Read {completed}/{total} programme blocks — {completed*150}/1200 DA registers; no writes.")
            elif event=="DONE":
                title,out,callback=payload;self.busy=False;self.status.set("Completed: "+title);self.log("SUCCESS: "+title)
                try:callback(out)
                except Exception as err:messagebox.showerror("Display issue",str(err))
                self.refresh_buttons()
            elif event=="ERROR":
                title,msg,iswrite,debug=payload;self.busy=False
                self._auto_backup=False;self._auto_show_explorer=False
                if iswrite:self.fail_latched=True
                self.status.set("FAILED: "+title);self.log("ERROR "+title+": "+msg);self.log(debug)
                if title.startswith("Reading 8 programmes"):
                    self.backupdetail.set("✕ BACKUP FAILED — no newly verified complete backup. Check the error; do not upload.")
                    self.book.select(self.t_backup)
                messagebox.showerror("Operation stopped — fail closed",msg+("\n\nWRITE FAILED: lock remains set for this connection. Keep heater isolated. Do not retry until memory is inspected." if iswrite else ""))
                self.refresh_buttons()
    except queue.Empty:pass
    self.root.after(100,self._pump)
 def exit(self):
    if self.busy:messagebox.showwarning("Busy", "Wait for current operation to complete or disconnect externally with heater isolated.");return
    if self.session and self.session.ram_touched and not self.session.committed:
        if not messagebox.askyesno("RAM data not saved", "Staged controller RAM has not been committed. Keep all heater power disconnected. Exit anyway?"):return
    if self.client:
        try:self.client.close()
        except Exception:pass
    self.root.destroy()

def main():
    pa=argparse.ArgumentParser();pa.add_argument("--enable-lab-writes",action="store_true",help="Enable guarded experimental RAM/staged transfer on isolated bench. DO NOT use live heater.");args=pa.parse_args()
    root=tk.Tk();Window(root,args.enable_lab_writes);root.mainloop()
if __name__=="__main__":main()
