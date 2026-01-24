# Closed-Loop AI Scientist for Cell Culture Optimization

## Objective

**Optimize growth conditions for a cell line** by combining Monomer's robotic workcell for automated experimentation with an AI scientist backend for intelligent experimental design.

## Document status

| Section | Status |
|---------|--------|
| System Architecture | ✅ Defined |
| Experiment Designer | 🔶 Partially Defined |
| Potato.ai Integration | ❓ TBD |
| Monomer MCP Interface | 🔶 Partially Defined |
| Data Pipeline | 🔶 Partially Defined |
| Webapp | 🔶 Partially Defined |

**Legend**: ✅ Defined | 🔶 Partially Defined | ❓ To Be Determined

---

## 1. System Architecture

### Core Loop

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│   │  Experiment  │───▶│   Monomer    │───▶│   Monomer    │───▶│    Data      │ │
│   │   Designer   │    │     MCP      │    │   Workcell   │    │   Parser     │ │
│   └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘ │
│          ▲                                                          │          │
│          │                                                          │          │
│          └──────────────────────────────────────────────────────────┘          │
│                              Feedback Loop                                      │
│                                        │                                        │
│                                        ▼                                        │
│                                 ┌──────────────┐                               │
│                                 │    Webapp    │                               │
│                                 │  (Human View)│                               │
│                                 └──────────────┘                               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Full System Diagram

```mermaid
flowchart TB
    subgraph SETUP["⚙️ ONE-TIME SETUP"]
        ROUTINES["Available Routines<br/><i>Define via Monomer MCP</i><br/><br/>🔶 <b>Needs: Routine selection</b>"]
    end

    subgraph INPUTS["📥 ITERATION INPUTS"]
        direction TB
        POTATO["🥔 Potato.ai<br/><i>Literature Search</i><br/><br/>❓ <b>TBD: Integration</b>"]
        PREV_DATA["📊 Previous Iteration Data<br/><i>OD readings + design mapping</i>"]
        HUMAN_REAGENTS["👤 Human Action<br/><i>Physical reagent placement</i>"]
    end

    subgraph DESIGNER["🧠 EXPERIMENT DESIGNER"]
        direction TB
        BAYESIAN["Bayesian Optimization"]
        CONSTRAINTS["Apply Physical Constraints"]
        DESIGN_OUTPUT["Generate 96 Designs<br/><i>1 per well</i>"]
        
        BAYESIAN --> CONSTRAINTS --> DESIGN_OUTPUT
    end

    subgraph OUTPUT_FILES["📄 EXPERIMENT FILES"]
        direction TB
        ROUTINE_PARAMS["Routine Parameters"]
        ROUTINES_TO_RUN["Routines to Run"]
        WELL_MAP["Well-to-Design Mapping"]
    end

    subgraph MCP["🔌 MONOMER MCP"]
        MCP_TRANSLATE["Translate to<br/>Workcell Commands"]
    end

    subgraph WORKCELL["🤖 MONOMER WORKCELL"]
        direction TB
        STEP1["<b>Step 1: Setup</b><br/>Configure each well<br/>per design parameters"]
        STEP2["<b>Step 2: Monitor Loop</b>"]
        
        subgraph MONITOR_LOOP["Repeat for N hours"]
            INCUBATE["Incubate"]
            READ_OD["Read OD"]
            INCUBATE --> READ_OD --> INCUBATE
        end
        
        STEP1 --> STEP2
        STEP2 --> MONITOR_LOOP
    end

    subgraph DATA_OUT["📈 RAW DATA"]
        RAW_OD["OD Readings<br/><i>96 wells × time series</i>"]
    end

    subgraph PARSER["🔄 DATA PARSER"]
        direction TB
        LINK["Link: Well → Design → OD"]
        METRICS["Calculate Growth Metrics"]
        STRUCTURE["Structure for Storage"]
        
        LINK --> METRICS --> STRUCTURE
    end

    subgraph WEBAPP["🌐 WEBAPP"]
        direction TB
        WEBAPP_VIEW["Human Dashboard<br/><i>• View iteration data</i><br/><i>• Monitor workcell status</i><br/><i>• Browse design results</i>"]
    end

    %% Setup flow (one-time)
    ROUTINES -->|"Informs constraints"| DESIGNER

    %% Iteration flow
    POTATO -->|"Early iterations"| DESIGNER
    PREV_DATA -->|"Later iterations"| DESIGNER
    HUMAN_REAGENTS -->|"Places reagents<br/>specified by Potato"| DESIGNER
    
    DESIGNER --> OUTPUT_FILES
    OUTPUT_FILES --> MCP
    MCP --> WORKCELL
    WORKCELL --> DATA_OUT
    DATA_OUT --> PARSER
    PARSER --> PREV_DATA
    PARSER --> WEBAPP

    %% Transition decision
    HUMAN_DECISION{{"👤 Human Decision:<br/>Fix reagents?"}}
    WEBAPP -.->|"Human reviews data"| HUMAN_DECISION
    HUMAN_DECISION -->|"Yes"| FIXED_MODE["Fixed Reagent Mode"]
    HUMAN_DECISION -->|"No"| EXPLORATION["Continue Exploration"]

    style POTATO fill:#ffe6cc,stroke:#d79b00
    style ROUTINES fill:#ffe6cc,stroke:#d79b00
    style HUMAN_DECISION fill:#e1d5e7,stroke:#9673a6
    style MCP fill:#dae8fc,stroke:#6c8ebf
    style WEBAPP fill:#d5e8d4,stroke:#82b366
```

---

## 2. Components

### 2.1 Experiment Designer

**Status**: 🔶 Partially Defined

The "brain" of the system. Uses Bayesian Optimization to generate experimental designs based on available data and physical constraints.

| Aspect | Decision |
|--------|----------|
| Core Algorithm | Bayesian Optimization |
| Agent Extension | Lower priority (future) |

**Inputs**

| Input | Source | When |
|-------|--------|------|
| Literature parameters | Potato.ai | Early iterations |
| Experimental results | Data Parser | Later iterations |
| Available routines | Monomer MCP | One-time setup |
| Reagent specification | Potato.ai | Early iterations |
| Physical reagent placement | Human | Early iterations (places what Potato specifies) |

**Outputs**

| Output | Description |
|--------|-------------|
| Routine parameters | Parameters for each routine to execute |
| Routines to run | Sequence of Monomer workcell routines |
| Well-to-design mapping | Links each of 96 wells to its design |

**Constraint**: All iterations must end with OD measurement.

---

### 2.2 Potato.ai Integration

**Status**: ❓ To Be Determined

Provides literature-based guidance for early iterations before sufficient experimental data exists.

| Question | Priority |
|----------|----------|
| How to interface with it Potato.ai for the early itterations? (API / tool / service) | High |
| What data format does it return? | High |

---

### 2.3 Monomer MCP Interface

**Status**: 🔶 Partially Defined

Translates experiment files into Monomer workcell commands and retrieves data.

**What's Defined**
- MCP connection is established and working
- Basic tools are available for querying plates and cultures

**Known Routines**

| Routine | Purpose |
|---------|---------|
| Measure Absorbance | OD600 reading (required every iteration) |
| Same Plate Passage | Cell passaging with configurable parameters |

**Available MCP Tools** (from current setup)

- `list_plates`, `get_plate_details`, `get_plate_observations`
- `list_cultures`, `get_culture_details`

**Remaining Work**

| Question | Priority |
|----------|----------|
| Which routines are available for our use case? | High |
| Which routines do we want to define/request? | High |
| Define MCP workflow for experiment submission to Monomer workcell | Medium |
| Define MCP workflow for OD data retrieval from Monomer workcell | Medium |

---

### 2.4 Monomer Workcell Execution

**Two-Phase Execution**

```mermaid
flowchart LR
    subgraph PHASE1["Phase 1: Setup"]
        SETUP["Configure 96 wells<br/>per design parameters"]
    end
    
    subgraph PHASE2["Phase 2: Monitor"]
        direction TB
        INC["Incubate"] --> OD["Read OD"]
        OD --> INC
    end
    
    PHASE1 --> PHASE2
    PHASE2 -->|"After N hours"| DONE["Complete"]
```

**Hardware**
- Tecan Infinite Platereader (OD measurement)
- Opentrons OT-2 (liquid handling)
- Liconic incubators (temperature control)
- PAA KX-2 robot arm (plate transport)

---

### 2.5 Data Parser

**Status**: 🔶 Partially Defined

Transforms raw OD data into structured datasets linking designs to outcomes.

**Processing Steps**

```mermaid
flowchart LR
    RAW["Raw OD<br/>from Tecan"] --> LINK["Link to<br/>Well Map"]
    LINK --> CALC["Calculate<br/>Metrics"]
    CALC --> STORE["Store<br/>Iteration"]
    STORE --> OUT1["→ Experiment Designer"]
    STORE --> OUT2["→ Webapp"]
```

**Core Data Structure**

```
Iteration N
├── metadata (id, timestamps, reagents)
├── designs (96 entries: well → parameters)
└── results (96 entries: well → OD time series + metrics)
```

**Calculated Metrics** (per well)

| Metric | Purpose |
|--------|---------|
| Exponential slope | Primary optimization target |
| Doubling time | Interpretable growth metric |
| R² value | Data quality indicator |

---

### 2.6 Webapp

**Status**: 🔶 Partially Defined

Dashboard for humans to monitor the system and review results.

**Features**

| Feature | Description | Priority |
|---------|-------------|----------|
| Iteration view | 96-well heatmap + OD curves for each well | High |
| Design details | View parameters for any well | High |
| Workcell status | Live updates from Monomer workcell | High |
| History | Browse past iterations | Medium |
| Comparison | Compare designs across iterations | Lower |

---

### 2.7 Transition Logic

**Status**: ✅ Defined

```mermaid
stateDiagram
    [*] --> Exploration
    
    state Exploration {
        [*] --> PotatoGuided
        PotatoGuided: Exploration Phase
        PotatoGuided: • Potato.ai specifies reagents to explore
        PotatoGuided: • Human places specified reagents on workcell
        PotatoGuided: • Broader parameter space
    }
    
    Exploration --> HumanDecision: Human decides
    HumanDecision --> Exploitation: Fix reagents
    HumanDecision --> Exploration: Continue exploring
    
    state Exploitation {
        [*] --> FixedReagents
        FixedReagents: Optimization Phase
        FixedReagents: • Reagents locked
        FixedReagents: • BO focuses on parameters
    }
    
    Exploitation --> [*]: Complete
```

**Trigger**: Human operator decides when to transition to fixed reagents (via Webapp review). Once transitioned, reagents are locked and no longer need to be placed.

---

## 3. Data Flow

### Per-Iteration Sequence

```mermaid
sequenceDiagram
    participant ED as Experiment Designer
    participant MCP as Monomer MCP
    participant WC as Monomer Workcell
    participant DP as Data Parser
    participant WA as Webapp
    
    ED->>ED: Generate 96 designs
    ED->>MCP: Submit experiment files
    MCP->>WC: Execute setup
    
    loop Monitor (N hours)
        WC->>WC: Incubate
        WC->>WC: Read OD
        WC-->>WA: Status update
    end
    
    WC-->>DP: Final OD dataset
    DP->>DP: Link + calculate metrics
    DP->>WA: Push results
    DP->>ED: Ready for next iteration
```

### File Organization

```
data/
└── iterations/
    └── iter_001/
        ├── input/
        │   ├── routine_parameters.json
        │   ├── routines_to_run.json
        │   └── well_to_design_mapping.json
        ├── output/
        │   └── od_readings.csv
        └── analysis/
            └── growth_metrics.json
```

---

## 4. Action Items

### High Priority

| Component | Action |
|-----------|--------|
| Potato.ai | Determine integration method |
| Potato.ai | Define output schema |
| Monomer MCP | Determine which routines are available |
| Monomer MCP | Define which routines we need for experiments |
| Monomer MCP | Define experiment submission workflow |
| Data Parser | Implement well-to-design linking |

### Medium Priority

| Component | Action |
|-----------|--------|
| Experiment Designer | Implement Bayesian Optimization |
| Webapp | Build iteration dashboard |
| Data Parser | Implement metric calculations |

### Lower Priority

| Component | Action |
|-----------|--------|
| Transition | System-proposed transition |
| Experiment Designer | Agent-based wrapper |
| Webapp | Cross-iteration comparison |

---

## 5. Open Questions

| ID | Question | Component |
|----|----------|-----------|
| Q1 | How does Potato.ai interface with our system? | Potato.ai |
| Q2 | Which available routines fit our experimental needs? | Monomer MCP |
| Q3 | Do we need to define custom routines, or use existing ones? | Monomer MCP |
| Q4 | How long should each monitoring phase run? | Experiment Designer |

---

## Glossary

| Term | Definition |
|------|------------|
| Iteration | One complete cycle: design → execute → measure → analyze |
| Design | Experimental parameters for one well |
| OD | Optical Density at 600nm (cell density proxy) |
| Routine | A Monomer workcell operation |
| Transition | Switch from reagent exploration to fixed-reagent optimization |

---
