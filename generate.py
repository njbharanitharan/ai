#!/usr/bin/env python3
import json
import datetime
from pathlib import Path

BASE = Path(__file__).resolve().parent

EXPLANT_MAP = {
    "shoot_tip": "shoot tips",
    "nodal": "nodal segments",
    "leaf": "leaf discs",
    "hypocotyl": "hypocotyl segments",
    "embryo": "immature embryos",
    "meristem": "meristematic tissue",
}

MEDIUM_MAP = {
    "ms": "MS (Murashige & Skoog)",
    "b5": "Gamborg B5",
    "wpm": "Woody Plant Medium",
    "nn": "Nitsch & Nitsch",
    "custom": "custom basal medium",
}

PGR_MAP = {
    "balanced": "a low-cost balanced auxin/cytokinin strategy",
    "shoot": "a cytokinin-forward shoot induction strategy",
    "root": "an auxin-forward rooting strategy",
    "none": "no exogenous growth regulators",
}

STERILIZATION_MAP = {
    "laminar": "standard laminar flow sterilization with ethanol and sodium hypochlorite",
    "budget": "budget sterilization using a clean bench substitute and extended rinses",
    "minimal": "minimal sterilants with extended pre-wash and rinse cycles",
}

SCALE_MAP = {
    "pilot": "pilot scale (20-50 explants)",
    "batch": "batch scale (100-250 explants)",
    "production": "production scale (500+ explants)",
}

CONDITION_MAP = {
    "standard": "25±2°C with a 16/8 h light/dark photoperiod",
    "cool": "22±2°C with a 16/8 h light/dark photoperiod",
    "warm": "27±2°C with a 16/8 h light/dark photoperiod",
    "dark": "25±2°C with 7 days in darkness before transfer to light",
}

BUDGET_MAP = {
    "strict": "strict cost minimization",
    "balanced": "balanced cost control and performance",
    "flexible": "flexible spending to optimize outcomes",
}


def load_inputs(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def build_protocol(data: dict) -> str:
    year = datetime.date.today().year
    species = data.get("species", "Arabidopsis thaliana")

    explant = EXPLANT_MAP.get(data.get("explant", "shoot_tip"), "shoot tips")
    medium = MEDIUM_MAP.get(data.get("medium", "ms"), "MS (Murashige & Skoog)")
    pgr = PGR_MAP.get(data.get("pgr", "balanced"), "a low-cost balanced auxin/cytokinin strategy")
    sterilization = STERILIZATION_MAP.get(data.get("sterilization", "laminar"), "standard laminar flow sterilization")
    scale = SCALE_MAP.get(data.get("scale", "pilot"), "pilot scale (20-50 explants)")
    conditions = CONDITION_MAP.get(data.get("conditions", "standard"), "25±2°C with a 16/8 h light/dark photoperiod")
    budget = BUDGET_MAP.get(data.get("budget", "strict"), "strict cost minimization")
    subculture = data.get("subculture", "4")
    notes = data.get("notes", "").strip()

    summary = (
        f"This protocol targets {species} using {explant} on {medium}. "
        f"It is optimized for {scale} under {budget} constraints."
    )

    steps = [
        "Select donor plants with documented health status and minimal pest pressure. Schedule collection to avoid stress conditions and record source metadata.",
        f"Excise {explant} using sterile tools. Pre-wash explants in running water for 15-20 minutes with a mild detergent.",
        f"Surface sterilize using {sterilization}. Rinse 3-5 times with sterile distilled water to reduce phytotoxicity.",
        f"Prepare {medium} supplemented with {pgr}, 3% sucrose, and 0.7-0.8% agar. Adjust pH to 5.7-5.8 before autoclaving.",
        "Inoculate explants onto initiation medium, orienting tissues to maximize meristem exposure. Label vessels with date, treatment, and explant type.",
        f"Incubate cultures at {conditions}. Monitor for contamination daily for the first 7 days.",
        f"Subculture every {subculture} weeks. Discard contaminated cultures and maintain lineage records to prevent mix-ups.",
        "Transition to multiplication medium and monitor shoot proliferation. Adjust PGR ratios incrementally to minimize physiological disorders.",
        "Induce rooting with reduced salts and auxin-forward conditions. Harden plantlets for 7-10 days in high humidity.",
        "Acclimatize in sterile substrate under gradual humidity reduction. Document survival rate, contamination frequency, and multiplication index.",
    ]

    budget_notes = [
        "Use reusable glassware where feasible, prioritize bulk media preparation, and implement batch sterilization schedules to reduce per-unit costs.",
        f"Scale to {scale} by staging initiation and multiplication in waves to limit peak incubator occupancy.",
    ]

    lines = [
        f"Academic Tissue Culture Protocol ({year})",
        "",
        summary,
        "",
        "Step-by-step workflow",
    ]

    for idx, step in enumerate(steps, 1):
        lines.append(f"{idx}. {step}")

    lines.extend(["", "Budget and scale considerations"])
    for idx, note in enumerate(budget_notes, 1):
        lines.append(f"{idx}. {note}")

    if notes:
        lines.extend(["", "Custom notes", f"1. {notes}"])

    return "\n".join(lines)


def main():
    inputs_path = BASE / "inputs.sample.json"
    output_path = BASE / "protocol.md"
    if not inputs_path.exists():
        raise SystemExit("inputs.sample.json not found")

    data = load_inputs(inputs_path)
    output = build_protocol(data)
    output_path.write_text(output, encoding="utf-8")
    print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
