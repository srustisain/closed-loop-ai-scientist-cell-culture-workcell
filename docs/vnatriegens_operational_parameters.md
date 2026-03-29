# V. natriegens Operational Parameters: Physical & Liquid Handling Variables

Beyond media composition (NaCl, MOPS, glucose, Mg²+, casamino acids), these are the **physical and operational parameters** that significantly affect V. natriegens growth in 96-well plate format. These are the knobs the liquid handler and plate reader can turn.

---

## Parameters to Optimize (Liquid Handler-Controllable)

### 1. Inoculation Density (Starting OD600) — 0.01 to 0.5

The initial cell density determines lag phase duration and time to stationary phase.

| Starting OD600 | Context | Source |
|----------------|---------|--------|
| 0.01–0.05 | Standard microplate growth curves | Bren et al. 2013 (PMC5752254) |
| 0.05 | Preculture from exponential phase | Hoffart et al. 2017 |
| 0.15 | Fed-batch inoculation | Stadler et al. 2021 |
| 0.25 | 96-deep well plate optimization | Hemmerich et al. 2025 (PMC12089209) |
| 0.5 | FeedPlate microtiter plate studies | Hemmerich et al. 2025 |

**Why it matters:** V. natriegens has minimal lag phase when inoculated from exponential-phase preculture. Too low (< 0.01) extends lag; too high (> 0.5) can cause immediate oxygen limitation in microplates. At OD 0.25–0.5, cells reach exponential growth almost immediately but consume O₂ faster than it can be replenished.

**Interaction with well volume:** Higher inoculation density + larger fill volume = earlier oxygen limitation.

### 2. Fill Volume per Well — 50 to 300 µL

Fill volume is the single most important physical parameter because it controls oxygen transfer rate (OTR).

| Fill Volume | Plate Type | OTR_max | Source |
|-------------|-----------|---------|--------|
| 50 µL | 96-deep well | >50 mmol/L/h | Hemmerich et al. 2025 |
| 100 µL | 96-deep well | ~30–50 mmol/L/h | Hemmerich et al. 2025 |
| 200 µL | Standard 96-well | ~10–15 mmol/L/h | Bren et al. 2013; general |
| 500 µL | Square-well 96 | ~38 mmol/L/h (at 300 rpm, 50mm) | Enzyscreen data |
| 800 µL | BioLector FlowerPlate | High (with O₂ enrichment) | Beckman app note |

**Critical for V. natriegens:** This organism has extreme oxygen demand. During exponential growth, OUR can reach 100–500 mmol/L/h in bioreactors. In microplates, oxygen becomes limiting very quickly at larger fill volumes. Lower fill volume = better surface-to-volume ratio = more O₂ transfer.

**Trade-off:** Lower volume increases evaporation effects and pipetting error. Minimum practical volume ~50 µL for accuracy.

### 3. Mix Cycles (Pre-Read Mixing) — 0 to 10 cycles

Mixing before OD measurement resuspends settled cells and ensures homogeneous readings.

| Mix Strategy | Description | Use Case |
|-------------|-------------|----------|
| 0 cycles (no mix) | Static read | Only for continuous-shaking readers |
| 3–5 cycles | Standard pre-read mix | Most growth curve protocols |
| 5–10 cycles | Aggressive resuspension | High-density cultures, cells that settle |
| Continuous shaking | Shake between all reads | Preferred for V. natriegens |

**Why it matters for V. natriegens:** Vibrio species are motile (polar flagellum) but still form gradients in microplate wells. Without mixing, OD reads are inconsistent. V. natriegens also produces biofilm under certain conditions, which mixing helps disrupt.

**Mix volume:** Typically 50–80% of well volume. E.g., for 200 µL culture, mix with 100–160 µL aspiration/dispense cycles.

### 4. Shaking Speed — 300 to 1200 rpm

| Shaking Speed | Shaking Diameter | Context | Source |
|--------------|-----------------|---------|--------|
| 300 rpm | 50 mm | Deep-well plates on orbital shaker | Enzyscreen |
| 567 cpm | linear | Plate reader (BioTek) | Bren et al. 2013 |
| 807 cpm | 1 mm (double orbital) | Plate reader (automated) | Szymula et al. 2022 |
| 1000 rpm | 3 mm | 96-deep well plate | Hemmerich et al. 2025 |
| 1200 rpm | 25 mm | BioLector XT microbioreactor | Beckman app note |

**Why it matters:** Shaking drives gas-liquid mass transfer (kₗa). V. natriegens' extreme O₂ demand means max shaking is generally optimal. However, shaking pattern (orbital vs double-orbital vs linear) and diameter interact with well geometry and fill volume.

**Recommendation:** Use maximum available shaking speed. Double-orbital preferred over linear for better mixing in round wells.

### 5. Measurement Interval — 1 to 60 minutes

| Interval | Purpose | Trade-off |
|----------|---------|-----------|
| 5 min | High-resolution kinetics | Pauses shaking for ~1 min per read; reduces aeration |
| 15 min | OTR monitoring (µTOM) | Good balance for V. natriegens |
| 30 min | Standard growth curves | May miss rapid transitions |
| 60 min | Long overnight runs | Insufficient for V. natriegens (can miss entire growth phases) |

**Critical for V. natriegens:** With 10 min doubling time, a 60-min interval captures only ~6 data points across 6 doublings. Use ≤15 min intervals. However, each read pauses shaking for ~1 min, reducing O₂ transfer. This creates a measurement-vs-growth trade-off.

### 6. Preculture Phase / Inoculum Source — Fresh vs. Frozen

| Inoculum Type | Lag Phase | Notes |
|--------------|-----------|-------|
| Exponential-phase preculture (OD ~1.5) | Minimal (<10 min) | Gold standard; 3–4h preculture at 37°C |
| Stationary-phase overnight | 30–60 min lag | More convenient but variable |
| Glycerol stock direct | 60–120+ min lag | Not recommended for growth optimization |
| Cryo-preserved mid-log | ~15–30 min lag | Good reproducibility |

**Protocol:** Inoculate preculture at OD 0.05 in BHI+v2 or LBv2, grow 3–4h at 37°C/350 rpm until OD ~1.5 (exponential phase), then dilute into experimental plate.

### 7. Aspiration / Dispense Speed — 50 to 300 µL/s

Pipetting speed affects cell viability through shear stress and mixing quality through turbulence.

| Speed | Effect | When to Use |
|-------|--------|-------------|
| 50–100 µL/s (slow) | Minimal shear, gentle on cells | Inoculation, fragile cells |
| 150–200 µL/s (medium) | Good balance of speed and accuracy | Standard transfers, mixing |
| 250–300 µL/s (fast) | Higher shear, risk of bubbles | Not recommended for cell culture |

**Why it matters:** Bacterial cells (including V. natriegens) are less shear-sensitive than mammalian cells, but excessive pipetting speed causes foaming in protein-rich media (BHI, LBv2), which traps air bubbles and interferes with OD readings. Default Opentrons flow rates are aspirate=300 µL/s, dispense=500 µL/s — these should be reduced for cell culture.

**Interaction with mix cycles:** Faster speed × more mix cycles = more shear. For V. natriegens in LBv2/BHI (foamy media), use moderate speed (100–200 µL/s) with 3–5 mix cycles.

### 8. Dispense Height / Tip Immersion Depth

| Position | Effect | Use Case |
|----------|--------|----------|
| Bottom of well (1–2 mm) | Best mixing, risk of scratching | Mixing/resuspension |
| Mid-well | Good dispense, less splashing | Standard transfers |
| Top of liquid | Minimal disturbance, poor mixing | Overlay additions |

**Why it matters:** Dispensing into the liquid (submerged) reduces splashing and bubble formation but increases cross-contamination risk. Dispensing above the liquid surface avoids contamination but creates droplets that affect OD reads. For inoculation, dispense at mid-well depth.

### 9. Incubation Duration / Growth Window — 2 to 24 hours

V. natriegens reaches stationary phase much faster than E. coli. The growth window determines what phase you capture.

| Duration | What You Capture | V. natriegens Context |
|----------|-----------------|----------------------|
| 2–4 h | Exponential phase only | Sufficient to measure µ_max in most media |
| 4–8 h | Full growth curve (lag → exp → stationary) | Ideal for growth rate + yield measurement |
| 8–12 h | Post-stationary, pH crash risk | Captures acetate overflow & death phase if unbuffered |
| 12–24 h | Extended stationary / death phase | Only useful for survival/viability studies |

**Critical for V. natriegens:** At µ = 4.4/h (9 min doubling), cells go from OD 0.05 to OD ~50 in just 5 hours if nutrients were unlimited. In practice, glucose depletion occurs at 3–6h depending on concentration. **A 4–8h window captures the complete growth phenotype.**

**Interaction:** Duration interacts strongly with MOPS buffer concentration. Without sufficient buffer, pH crashes by 4h and cells die by 12h.

### 10. Well Geometry — Round vs Square vs Deep Well

| Well Type | Max Volume | OTR_max | kₗa | Best For |
|-----------|-----------|---------|------|----------|
| Standard round (330 µL) | 200 µL working | ~10–15 mmol/L/h | 0.036 s⁻¹ | Plate reader kinetics |
| Deep-well round (1 mL) | 500 µL working | ~20–30 mmol/L/h | — | Intermediate aeration |
| Deep-well square (2 mL) | 500 µL working | ~38–40 mmol/L/h | 0.052 s⁻¹ | High O₂ demand organisms |
| Half-deep-well square | 300 µL working | ~30 mmol/L/h | — | Balance of OTR & reader compatibility |

**Why it matters for V. natriegens:** Square deep-well plates provide 44% higher kₗa than round wells (0.052 vs 0.036 s⁻¹) due to baffling effect. V. natriegens' extreme O₂ demand makes this difference significant. However, deep-well plates are incompatible with most plate readers for continuous OD monitoring.

**Practical compromise:** Use standard round-well plates in the plate reader (accept lower OTR), OR use deep-well square plates on orbital shaker with endpoint reads.

---

## Parameters to Fix (Plate-Wide, Non-Variable)

### 11. Shaking Pattern — Double Orbital (Fixed)

Double-orbital provides better mixing and O₂ transfer than linear or single orbital in round-well plates. Fix at double-orbital when available.

### 12. Plate Seal / Lid Type — Gas-Permeable Seal (Fixed)

| Seal Type | Evaporation | O₂ Transfer | Recommendation |
|-----------|-------------|-------------|----------------|
| No seal | High (edge wells lose 20–30%) | Maximum | Not recommended |
| Standard lid | Medium | Good | OK for short runs (<6h) |
| Gas-permeable seal | Low (~5% over 24h) | Good | Recommended for V. natriegens |
| Adhesive film | Very low | Poor (O₂ limited) | NOT recommended |

### 13. Temperature — 37°C (Fixed)

Optimal for growth rate. Some studies use 30°C for protein expression (to reduce misfolding), but for growth optimization, 37°C is standard.

### 14. Humidity — 80%+ (Fixed)

Reduces evaporation. Most plate readers with incubation chambers support humidity control. Set to maximum available.

### 15. Edge Well Strategy — Blank/Water Only (Fixed)

Edge wells (rows A/H, columns 1/12) show 10–30% higher evaporation. Fill with water or blank medium as evaporation barriers. Use only interior 60 wells for experiments.

---

## Derived / Interaction Parameters

These aren't independent knobs but emerge from combinations:

| Derived Parameter | Depends On | Effect |
|-------------------|-----------|--------|
| Oxygen Transfer Rate (OTR) | Fill volume × shaking speed × shaking diameter × well geometry | Limits max growth rate in microplates |
| Evaporation rate | Fill volume × seal type × temperature × humidity × run duration | Changes effective concentration over time |
| Effective doubling time | All above + media composition | What you actually measure |
| Time to stationary phase | Inoculation OD × fill volume × glucose concentration × OTR | Determines experimental duration |

---

## Recommended Search Space for Bayesian Optimization

These are the operational parameters worth varying across wells (in addition to the 5 media composition parameters):

| Parameter | Low | High | Unit | Notes |
|-----------|-----|------|------|-------|
| Inoculation OD600 | 0.01 | 0.25 | AU | Diluted from exponential preculture |
| Fill volume | 50 | 250 | µL | Lower = more O₂, but more evaporation |
| Mix cycles (pre-read) | 0 | 10 | cycles | 0 if continuous shaking; 3–5 typical |
| Mix volume fraction | 0.5 | 0.8 | fraction of fill vol | Volume aspirated/dispensed per mix cycle |

### Parameters to Fix at Optimal

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Shaking speed | Max available (≥800 rpm) | V. natriegens O₂ demand requires maximum |
| Shaking pattern | Double orbital | Best mixing in round wells |
| Measurement interval | 10–15 min | Fast enough for 10-min doubler; minimizes shaking pauses |
| Seal | Gas-permeable | Balances O₂ transfer and evaporation |
| Preculture phase | Exponential (OD ~1.5) | Eliminates lag phase variability |
| Humidity | 80%+ | Minimizes evaporation |
| Edge wells | Water blanks | Evaporation barrier |

---

## Combined Parameter Space (Media + Operational)

Adding operational parameters to the 5 media parameters gives a 7–9 dimensional search space:

**Media (5 parameters):**
1. NaCl — 5–15 g/L
2. MOPS — 100–400 mM
3. Glucose — 5–20 g/L
4. MgSO₄ — 1–25 mM
5. Casamino acids — 0–5 g/L

**Operational (2–4 parameters):**
6. Inoculation OD600 — 0.01–0.25
7. Fill volume — 50–250 µL
8. Mix cycles — 0–10 (optional, may fix)
9. Mix volume fraction — 0.5–0.8 (optional, may fix)

**Strategy:** Start with 7D (media 5 + inoculation OD + fill volume). These two operational parameters have the strongest documented effect. Add mix parameters only if initial rounds show measurement noise.

---

## Key References

1. Hemmerich et al. (2025) — "Small-scale fed-batch cultivations of V. natriegens" (Bioprocess Biosyst Eng, PMC12089209)
2. Bren et al. (2013) — "Precise, High-throughput Analysis of Bacterial Growth" (PMC5752254)
3. Szymula et al. (2022) — "Method for reproducible automated bacterial cell culture" (Synth Biol, PMC9462466)
4. Hoffart et al. (2017) — "High Substrate Uptake Rates" (Appl Environ Microbiol, PMC5666143)
5. Stadler et al. (2021) — "High-cell-density fed-batch cultivations" (Biotechnol Lett, PMC8397650)
6. Pfeifer et al. (2019) — "Analysis and optimization of growth conditions" (bioRxiv 775437)
7. Beckman Coulter — "Aerobic cultivation of high-O₂-demand microorganisms in BioLector XT" (App Note)
8. Enzyscreen — "Hydrodynamics inside wells of a 96-square deepwell microplate"
9. Gericke/Forsten et al. (2024) — "Impact of pH, Na, osmolality" (BMC Biotechnology)
10. Hamilton Company — "Best Practices for Common Liquid Handling Activities"
