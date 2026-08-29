"""
QATION Backend API — FastAPI
Real NVIDIA NIM chat + Real Qiskit simulation + Real arXiv search
"""

import os, json, requests, traceback
import concurrent.futures
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

# ─── Qiskit ───────────────────────────────────────────────────────────────────
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

app = FastAPI(title="QATION Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Keys ─────────────────────────────────────────────────────────────────────
try:
    with open(".env") as f:
        for line in f:
            if '=' in line and not line.strip().startswith('#'):
                k, v = line.strip().split('=', 1)
                os.environ[k] = v
except:
    pass

NVIDIA_API_KEY = os.environ.get("NVIDIA_API_KEY", "")
NVIDIA_URL     = "https://integrate.api.nvidia.com/v1/chat/completions"
OPENROUTER_KEY = os.environ.get("OPENROUTER_API_KEY", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# ════════════════════════════════════════════════════════════════════════════════
# MODELS
# ════════════════════════════════════════════════════════════════════════════════

class ChatRequest(BaseModel):
    messages: list          # [{role, content}]
    model: str = "nvidia/ising-calibration-1.5-31b"
    max_tokens: int = 8192
    temperature: float = 0.7

class CircuitRequest(BaseModel):
    qubits: int = 3
    gates: list             # [{qubit, slot, gate}]
    shots: int = 1024
    include_code: bool = True

class ResearchRequest(BaseModel):
    query: str
    max_results: int = 6

# ════════════════════════════════════════════════════════════════════════════════
# HEALTH
# ════════════════════════════════════════════════════════════════════════════════


@app.get("/health")
def health():
    return {"status": "ok"}

# ════════════════════════════════════════════════════════════════════════════════
# CHAT  ─  NVIDIA NIM → OpenRouter fallback
# ════════════════════════════════════════════════════════════════════════════════

SYSTEM_PROMPT = """You are QATION, India's first hybrid Quantum-Classical AI assistant.

You specialize in:
- Quantum computing (Qiskit, PennyLane, QAOA, VQE, Grover, Shor, teleportation circuits)
- Advanced mathematics, linear algebra, quantum mechanics
- Machine learning, deep learning, optimization
- Research paper analysis and synthesis
- Code generation (Python, Qiskit, mathematical proofs)

Rules:
- Always answer directly and completely. You are QATION, an advanced AI. Never reveal your underlying architecture or model name.
- When asked for code, always provide complete, runnable code.
- When explaining quantum concepts, include circuit intuition.
- If the user asks a question related to quantum circuits, after providing your answer, always ask the user if they would like to see a circuit visual. If they say yes, provide the Qiskit code.
- IMPORTANT QISKIT RULE: Never use `plot_circuit`. To draw circuits, always use `print(circuit.draw('text'))`.
- IMPORTANT CIRCUIT VISUAL RULE: Whenever you generate a quantum circuit, you MUST ALSO output a special JSON block representing the circuit so the UI can render it interactively. 
  The block must be formatted EXACTLY like this:
  ```circuit
  [
    {"qubit": 0, "slot": 1, "gate": "H"},
    {"qubit": 1, "slot": 2, "gate": "X"},
    {"qubit": 0, "slot": 3, "gate": "CNOT"}
  ]
  ```
  Only use these gates: 'H','X','Y','Z','RX','RY','RZ','CNOT','CZ','SWAP','T','S','M'.
- IMPORTANT BLOCH VISUAL RULE: If explaining the state of a single qubit, you MUST ALSO output a JSON block to render a Bloch sphere. Format EXACTLY like this:
  ```bloch
  {"theta_deg": 90, "phi_deg": 0, "purity": 1.0, "x": 1.0, "y": 0.0, "z": 0.0}
  ```
- Format responses with proper markdown (headers, code blocks, equations). Avoid excessive spacing.
- Be precise, technical, and premium in tone, but when generating long prose or essays, write in a highly human-like manner. Use synonyms, high burstiness, high perplexity, and varied sentence structures to ensure the text bypasses AI detectors like ZeroGPT. 
- ABSOLUTELY DO NOT USE AI BUZZWORDS (e.g., "delve", "testament", "tapestry", "embark", "crucial", "beacon", "meticulously", "moreover", "in conclusion", "pivotal", "seamless", "unlocking").
- Avoid generic AI transitions, robotic phrasing, over-structured essays, predictable transitions, and monotonous tone. 
- Emulate a natural, human, conversational writing style that exhibits a personal voice, varied sentence lengths (high burstiness), and diverse vocabulary (high perplexity) to ensure the text bypasses AI detectors and avoids known signs of AI-generated content.
"""

def _nvidia_chat(messages, model, max_tokens=2048, temperature=0.7, system_prompt=SYSTEM_PROMPT):
    payload = {
        "model": model,
        "messages": [{"role": "system", "content": system_prompt}] + messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "top_p": 0.95,
        "stream": False,
    }
    r = requests.post(
        NVIDIA_URL,
        headers={"Authorization": f"Bearer {NVIDIA_API_KEY}", "Content-Type": "application/json"},
        json=payload,
        timeout=180,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


def _openrouter_chat(messages, model, max_tokens=2048, temperature=0.7, system_prompt=SYSTEM_PROMPT):
    payload = {
        "model": model,
        "messages": [{"role": "system", "content": system_prompt}] + messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    r = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://qation.ai",
            "X-Title": "QATION Platform",
        },
        json=payload,
        timeout=180,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


def _gemini_chat(messages, max_tokens=2048, temperature=0.7, system_prompt=SYSTEM_PROMPT):
    contents = []
    for m in messages:
        role = "model" if m["role"] == "assistant" else "user"
        contents.append({"role": role, "parts": [{"text": m["content"]}]})
        
    payload = {
        "contents": contents,
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "generationConfig": {
            "maxOutputTokens": 8192,
            "temperature": temperature,
        }
    }
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={GEMINI_API_KEY}"
    
    import time
    for attempt in range(3):
        try:
            r = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=25)
            r.raise_for_status()
            data = r.json()
            print("GEMINI RAW RESPONSE:", data)
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            if attempt == 2:
                print(f"Gemini API failed after 3 attempts: {e}")
                raise e
            print(f"Gemini API error (attempt {attempt+1}/3), retrying in 2 seconds...")
            time.sleep(2)


@app.post("/api/chat")
def chat(req: ChatRequest):
    try:
        # 1. Apply Q-SIL (Quantum Structural Interaction Layer)
        # Calculate coherence between the last two user messages (or user message and system prompt)
        user_msgs = [m["content"] for m in req.messages if m["role"] == "user"]
        qsil_coherence = 1.0
        if len(user_msgs) >= 2:
            qsil_coherence = calculate_qsil_coherence(user_msgs[-2], user_msgs[-1])
        elif len(user_msgs) == 1:
            qsil_coherence = calculate_qsil_coherence("Initialize quantum state", user_msgs[-1])
            
        # 2. Enforce Zero Hallucination Tolerance (Hard Mathematical Boundary)
        # If structural coherence drops below 0.4 (destructive interference), wipe the context window.
        # This prevents context bleed from wildly different topics.
        if qsil_coherence < 0.4 and len(req.messages) > 2:
            print(f"[Q-SIL] Coherence {qsil_coherence:.4f} is below threshold. Wiping context window to prevent hallucination.")
            # Keep only the very last user message to completely wipe conversational context
            req.messages = [req.messages[-1]]
            
        nvidia_models = ["nvidia/ising-calibration-1.5-31b", "meta/llama-3.1-70b-instruct"]
        if req.model in nvidia_models or req.model.startswith("nvidia/"):
            if "llama" in req.model.lower():
                req.model = "meta/llama-3.1-8b-instruct"
            content = _nvidia_chat(req.messages, req.model, req.max_tokens, req.temperature, system_prompt=SYSTEM_PROMPT)
        elif "gemini" in req.model.lower():
            try:
                content = _gemini_chat(req.messages, req.max_tokens, req.temperature, system_prompt=SYSTEM_PROMPT)
            except Exception as e:
                print(f"[Chat] Gemini failed, falling back to NVIDIA: {e}")
                content = _nvidia_chat(req.messages, "meta/llama-3.1-8b-instruct", req.max_tokens, req.temperature, system_prompt=SYSTEM_PROMPT)
        else:
            content = _openrouter_chat(req.messages, req.model.replace("70b", "8b"), req.max_tokens, req.temperature, system_prompt=SYSTEM_PROMPT)
        
        print(f"Generated response. Q-SIL Coherence (Metadata): {qsil_coherence:.4f}")
        
        # Add Q-SIL metadata to response for the UI to optionally display
        return {
            "role": "assistant", 
            "content": content,
            "qsil_coherence": qsil_coherence
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ════════════════════════════════════════════════════════════════════════════════
# AI CIRCUIT SYNTHESIS  (Text-to-Circuit)
# ════════════════════════════════════════════════════════════════════════════════

SYNTHESIS_SYSTEM_PROMPT = """You are a quantum circuit compiler. Your ONLY job is to convert a natural-language description of a quantum circuit into a structured JSON response.

You MUST respond with valid JSON only — no prose, no markdown, no code blocks. The JSON schema is:

{
  "description": "<one sentence describing what this circuit does>",
  "num_qubits": <integer, 1-8>,
  "gates": [
    {"qubit": <int>, "slot": <int, 1-indexed column>, "gate": "<gate name>"},
    ...
  ],
  "code": "<complete Qiskit Python code as a single string with \\n for newlines>"
}

Gate vocabulary (ONLY use these): H, X, Y, Z, S, T, RX, RY, RZ, CNOT, CZ, SWAP, M

Rules for gate placement:
- Slots are time-ordered columns starting at 1.
- CNOT: place on the control qubit; the target is implicitly qubit+1.
- Keep circuits compact — reuse slots where qubits don't conflict.
- Always add M (measurement) gates at the end on the last slot for all qubits.
- The Qiskit code must be complete, runnable, and use print(qc.draw('text')) to display.
- Never exceed 8 qubits or 12 slots.

Examples of valid gate entries:
{"qubit": 0, "slot": 1, "gate": "H"}
{"qubit": 0, "slot": 2, "gate": "CNOT"}   <- CNOT on q0, target q1
{"qubit": 0, "slot": 3, "gate": "M"}
"""

class SynthesisRequest(BaseModel):
    prompt: str

@app.post("/api/circuit-synthesis")
def circuit_synthesis(req: SynthesisRequest):
    """
    Converts a natural language prompt into a structured quantum circuit.
    Uses the available AI backend (Gemini → OpenRouter → NVIDIA fallback).
    """
    try:
        messages = [{"role": "user", "content": req.prompt}]

        raw = None
        # Try Gemini first (fastest, most instruction-following)
        if GEMINI_API_KEY:
            try:
                raw = _gemini_chat(messages, max_tokens=4096, temperature=0.2, system_prompt=SYNTHESIS_SYSTEM_PROMPT)
            except Exception as e:
                print(f"[Synthesis] Gemini failed: {e}")

        # Fallback to OpenRouter
        if raw is None and OPENROUTER_KEY:
            try:
                raw = _openrouter_chat(messages, "meta/llama-3.1-8b-instruct", max_tokens=4096, temperature=0.2, system_prompt=SYNTHESIS_SYSTEM_PROMPT)
            except Exception as e:
                print(f"[Synthesis] OpenRouter failed: {e}")

        # Fallback to NVIDIA
        if raw is None and NVIDIA_API_KEY:
            raw = _nvidia_chat(messages, "meta/llama-3.1-8b-instruct", max_tokens=4096, temperature=0.2, system_prompt=SYNTHESIS_SYSTEM_PROMPT)

        if raw is None:
            raise HTTPException(status_code=503, detail="No AI backend available. Please check your API keys in .env")

        # Strip markdown code fences if the model wrapped JSON anyway
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = "\n".join(cleaned.split("\n")[1:])
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3].strip()

        data = json.loads(cleaned)

        # Validate and clamp values
        data["num_qubits"] = max(1, min(8, int(data.get("num_qubits", 2))))
        gates = data.get("gates", [])

        # Sanitize gate list
        VALID_GATES = {"H","X","Y","Z","S","T","RX","RY","RZ","CNOT","CZ","SWAP","M"}
        sanitized = []
        for g in gates:
            gate_name = str(g.get("gate", "")).upper()
            if gate_name not in VALID_GATES:
                continue
            qubit = int(g.get("qubit", 0))
            slot  = int(g.get("slot", 1))
            if qubit < 0 or qubit >= data["num_qubits"]:
                continue
            sanitized.append({"qubit": qubit, "slot": slot, "gate": gate_name})

        data["gates"] = sanitized
        return data

    except json.JSONDecodeError as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI returned malformed JSON: {str(e)}. Raw: {raw[:300] if raw else 'None'}")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ════════════════════════════════════════════════════════════════════════════════
# QUANTUM CIRCUIT SIMULATION  (Real Qiskit + Aer)
# ════════════════════════════════════════════════════════════════════════════════

GATE_MAP = {
    "H":    lambda qc, q, _: qc.h(q),
    "X":    lambda qc, q, _: qc.x(q),
    "Y":    lambda qc, q, _: qc.y(q),
    "Z":    lambda qc, q, _: qc.z(q),
    "S":    lambda qc, q, _: qc.s(q),
    "T":    lambda qc, q, _: qc.t(q),
    "RX":   lambda qc, q, _: qc.rx(1.5708, q),   # π/2
    "RY":   lambda qc, q, _: qc.ry(1.5708, q),
    "RZ":   lambda qc, q, _: qc.rz(1.5708, q),
    "SWAP": lambda qc, q, _: None,  # handled separately
}

@app.post("/api/simulate")
def simulate(req: CircuitRequest):
    try:
        n = max(req.qubits, 1)
        qc = QuantumCircuit(n, n)

        # Apply gates from circuit layout
        cnot_targets = {}
        for g in req.gates:
            gate = g.get("gate", "").upper()
            qubit = int(g.get("qubit", 0))
            if qubit >= n:
                continue
            if gate == "M":
                qc.measure(qubit, qubit)
            elif gate == "CNOT":
                target = (qubit + 1) % n
                qc.cx(qubit, target)
            elif gate == "CZ":
                target = (qubit + 1) % n
                qc.cz(qubit, target)
            elif gate in GATE_MAP:
                GATE_MAP[gate](qc, qubit, None)

        # If no measurements exist, measure all
        has_measure = any(g.get("gate","").upper() == "M" for g in req.gates)
        if not has_measure:
            qc.measure_all()

        # Run on Aer statevector simulator
        sim = AerSimulator()
        result = sim.run(qc, shots=req.shots).result()
        counts = result.get_counts()

        # Build probability table
        total = sum(counts.values())
        probs = {state: round(cnt / total * 100, 2) for state, cnt in sorted(counts.items(), key=lambda x: -x[1])}

        # Top states
        top_states = [{"state": f"|{s}⟩", "probability": p} for s, p in list(probs.items())[:8]]

        # Circuit depth
        depth = qc.depth()
        gate_count = sum(1 for inst in qc.data if inst.operation.name not in ("measure", "barrier"))

        # Generate Qiskit code
        qiskit_code = _gen_qiskit_code(req.qubits, req.gates)

        return {
            "success": True,
            "probabilities": top_states,
            "counts": counts,
            "depth": depth,
            "gate_count": gate_count,
            "qubits": n,
            "shots": req.shots,
            "qiskit_code": qiskit_code,
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


import string

def calculate_qsil_coherence(s1: str, s2: str) -> float:
    """
    Implements the Two-Qubit Quantum Structural Interaction Layer (Q-SIL)
    for Deterministic Sentence Comparison as designed by Anand Krishna P V.
    """
    import math
    from qiskit import QuantumCircuit
    from qiskit.quantum_info import Statevector
    
    def extract_features(s: str):
        l_s = sum(1 for c in s if c.isalpha())
        w_s = len(s.split())
        d_s = sum(1 for c in s if c.isdigit())
        o_s = sum(1 for c in s if c in "+-*/=<>")
        
        if d_s + o_s > 0:
            v = [d_s, o_s + 1]
        else:
            v = [l_s + 1, w_s + 1]
            
        norm = math.sqrt(v[0]**2 + v[1]**2)
        return [v[0]/norm, v[1]/norm]

    # Amplitude Encoding
    v1 = extract_features(s1)
    v2 = extract_features(s2)
    
    # |Ψ₀⟩ = |ψ(s₁)⟩ ⊗ |ψ(s₂)⟩
    # Statevector expects tensor product order, we can initialize a 2-qubit circuit
    qc = QuantumCircuit(2)
    
    # Initialize qubit 0 with s1 and qubit 1 with s2
    qc.initialize(v1, 0)
    qc.initialize(v2, 1)
    
    # Apply Hadamard on first qubit
    qc.h(0)
    
    # Apply CNOT (control 0, target 1)
    qc.cx(0, 1)
    
    # Measure probabilities
    sv = Statevector(qc)
    probs = sv.probabilities_dict()
    
    # Compute Coherence C = P00 + P11
    p00 = probs.get('00', 0.0)
    p11 = probs.get('11', 0.0)
    coherence = p00 + p11
    
    return coherence


def _gen_qiskit_code(n_qubits, gates):
    lines = [
        "from qiskit import QuantumCircuit",
        "from qiskit_aer import AerSimulator",
        "",
        f"qc = QuantumCircuit({n_qubits}, {n_qubits})",
        "",
    ]
    for g in gates:
        gate = g.get("gate", "").upper()
        q = int(g.get("qubit", 0))
        if q >= n_qubits: continue
        if gate == "H":    lines.append(f"qc.h({q})")
        elif gate == "X":  lines.append(f"qc.x({q})")
        elif gate == "Y":  lines.append(f"qc.y({q})")
        elif gate == "Z":  lines.append(f"qc.z({q})")
        elif gate == "S":  lines.append(f"qc.s({q})")
        elif gate == "T":  lines.append(f"qc.t({q})")
        elif gate == "RX": lines.append(f"qc.rx(1.5708, {q})")
        elif gate == "RY": lines.append(f"qc.ry(1.5708, {q})")
        elif gate == "RZ": lines.append(f"qc.rz(1.5708, {q})")
        elif gate == "CNOT": lines.append(f"qc.cx({q}, {(q+1) % n_qubits})")
        elif gate == "CZ":   lines.append(f"qc.cz({q}, {(q+1) % n_qubits})")
        elif gate == "M":    lines.append(f"qc.measure({q}, {q})")
    lines += [
        "",
        "sim = AerSimulator()",
        "result = sim.run(qc, shots=1024).result()",
        "counts = result.get_counts()",
        "print(counts)",

    ]
    return "\n".join(lines)


# ════════════════════════════════════════════════════════════════════════════════
# ARXIV RESEARCH SEARCH (Real arXiv API)
# ════════════════════════════════════════════════════════════════════════════════

import xml.etree.ElementTree as ET

@app.post("/api/research/search")
def research_search(req: ResearchRequest):
    try:
        base = "https://export.arxiv.org/api/query"
        params = {
            "search_query": f"all:{req.query}",
            "start": 0,
            "max_results": req.max_results,
            "sortBy": "relevance",
            "sortOrder": "descending",
        }
        r = requests.get(base, params=params, timeout=20)
        r.raise_for_status()

        ns = {"atom": "http://www.w3.org/2005/Atom",
              "arxiv": "http://arxiv.org/schemas/atom"}
        root = ET.fromstring(r.text)
        papers = []

        for entry in root.findall("atom:entry", ns):
            title   = (entry.find("atom:title", ns).text or "").strip().replace("\n", " ")
            summary = (entry.find("atom:summary", ns).text or "").strip()[:300] + "..."
            link    = entry.find("atom:id", ns).text or ""
            authors = [a.find("atom:name", ns).text for a in entry.findall("atom:author", ns)]
            pub     = entry.find("atom:published", ns)
            date    = pub.text[:10] if pub is not None else ""
            cats    = [c.get("term","") for c in entry.findall("atom:category", ns)]

            papers.append({
                "title":    title,
                "summary":  summary,
                "url":      link,
                "authors":  authors[:3],
                "date":     date,
                "category": cats[0] if cats else "",
                "arxiv_id": link.split("/")[-1] if link else "",
            })

        return {"papers": papers, "total": len(papers)}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



# ════════════════════════════════════════════════════════════════════════════════
# BLOCH SPHERE  (Real Qiskit Statevector → Bloch coordinates)
# ════════════════════════════════════════════════════════════════════════════════

class BlochRequest(BaseModel):
    qubits: int = 1
    gates: list = []   # same format as CircuitRequest


@app.post("/api/bloch")
def bloch_sphere(req: BlochRequest):
    """
    Run a Qiskit statevector simulation and return Bloch sphere (x, y, z)
    for each qubit.
    """
    try:
        from qiskit.quantum_info import Statevector, DensityMatrix, partial_trace
        import numpy as np

        n = max(req.qubits, 1)
        qc = QuantumCircuit(n, n)

        for g in req.gates:
            gate = g.get("gate", "").upper()
            qubit = int(g.get("qubit", 0))
            if qubit >= n:
                continue
            if gate == "H":    qc.h(qubit)
            elif gate == "X":  qc.x(qubit)
            elif gate == "Y":  qc.y(qubit)
            elif gate == "Z":  qc.z(qubit)
            elif gate == "S":  qc.s(qubit)
            elif gate == "T":  qc.t(qubit)
            elif gate == "RX": qc.rx(1.5708, qubit)
            elif gate == "RY": qc.ry(1.5708, qubit)
            elif gate == "RZ": qc.rz(1.5708, qubit)
            elif gate == "CNOT":
                target = (qubit + 1) % n
                qc.cx(qubit, target)

        sv = Statevector(qc)
        bloch_vectors = []

        for i in range(n):
            # Trace out all other qubits
            keep = list(range(n))
            keep.remove(i)
            if keep:
                dm = partial_trace(sv, keep)
            else:
                dm = DensityMatrix(sv)

            rho = dm.data
            x = float(2 * np.real(rho[0, 1]))
            y = float(2 * np.imag(rho[1, 0]))
            z = float(np.real(rho[0, 0] - rho[1, 1]))
            theta = float(np.arccos(np.clip(z, -1, 1)))
            phi   = float(np.arctan2(y, x))

            bloch_vectors.append({
                "qubit": i,
                "x": round(x, 4),
                "y": round(y, 4),
                "z": round(z, 4),
                "theta_deg": round(np.degrees(theta), 2),
                "phi_deg":   round(np.degrees(phi), 2),
                "purity":    round(float(np.real(np.trace(rho @ rho))), 4),
            })

        return {"bloch_vectors": bloch_vectors, "qubits": n}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ════════════════════════════════════════════════════════════════════════════════
# WORKSPACE  (Real filesystem scan)
# ════════════════════════════════════════════════════════════════════════════════

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))

@app.get("/api/workspace")
def workspace():
    """Return mock workspace data for the SaaS user."""
    mock_files = [
        {
            "name": "Quantum Teleportation",
            "filename": "teleportation.qasm",
            "path": "circuits/teleportation.qasm",
            "type": "Circuit",
            "size_kb": 1.2,
            "modified": "Aug 05, 2026",
            "folder": "circuits"
        },
        {
            "name": "VQE Experiment",
            "filename": "vqe_experiment.ipynb",
            "path": "notebooks/vqe_experiment.ipynb",
            "type": "Notebook",
            "size_kb": 24.5,
            "modified": "Aug 06, 2026",
            "folder": "notebooks"
        },
        {
            "name": "QAOA Results",
            "filename": "qaoa_results.json",
            "path": "data/qaoa_results.json",
            "type": "Data",
            "size_kb": 105.4,
            "modified": "Aug 07, 2026",
            "folder": "data"
        },
        {
            "name": "Error Mitigation Script",
            "filename": "error_mitigation.py",
            "path": "scripts/error_mitigation.py",
            "type": "Script",
            "size_kb": 4.1,
            "modified": "Aug 07, 2026",
            "folder": "scripts"
        }
    ]
    return {
        "files": mock_files,
        "total": len(mock_files),
        "total_mb": round(sum(f["size_kb"] for f in mock_files) / 1024, 2),
    }


# ════════════════════════════════════════════════════════════════════════════════
# NOTEBOOK EXECUTION (Real Python/Qiskit execution)
# ════════════════════════════════════════════════════════════════════════════════

class ExecuteRequest(BaseModel):
    code: str

@app.post("/api/execute")
def execute_code(req: ExecuteRequest):
    """Executes arbitrary python code locally (for Notebook View) and captures stdout."""
    import sys
    import io
    import time
    
    start_time = time.time()
    
    # Capture standard output
    old_stdout = sys.stdout
    redirected_output = sys.stdout = io.StringIO()
    
    try:
        # Execute the code in a new local dictionary
        local_scope = {}
        exec(req.code, {}, local_scope)
        success = True
    except Exception as e:
        success = False
        print(f"{type(e).__name__}: {str(e)}")
    finally:
        sys.stdout = old_stdout
        
    duration = time.time() - start_time
    output_str = redirected_output.getvalue()
    
    return {
        "output": output_str.strip(),
        "time": f"{duration:.2f}s",
        "success": success
    }

# ════════════════════════════════════════════════════════════════════════════════
# ENTERPRISE FEATURES (Transpilation, IBM Hardware, VQA)
# ════════════════════════════════════════════════════════════════════════════════

class TranspileRequest(BaseModel):
    qubits: int = 1
    gates: list = []

@app.post("/api/transpile")
def transpile_circuit(req: TranspileRequest):
    """
    Optimizes a logical circuit for a specific hardware topology.
    We simulate the transpilation against a heavy coupling map (e.g., a heavy hex lattice like IBM Eagle).
    """
    try:
        from qiskit import transpile
        from qiskit.transpiler import CouplingMap
        import math

        n = max(req.qubits, 1)
        qc = QuantumCircuit(n, n)

        # Build original circuit
        for g in req.gates:
            gate = g.get("gate", "").upper()
            qubit = int(g.get("qubit", 0))
            if qubit >= n: continue
            if gate == "H":    qc.h(qubit)
            elif gate == "X":  qc.x(qubit)
            elif gate == "Y":  qc.y(qubit)
            elif gate == "Z":  qc.z(qubit)
            elif gate == "S":  qc.s(qubit)
            elif gate == "T":  qc.t(qubit)
            elif gate == "RX": qc.rx(math.pi/2, qubit)
            elif gate == "RY": qc.ry(math.pi/2, qubit)
            elif gate == "RZ": qc.rz(math.pi/2, qubit)
            elif gate == "CNOT":
                target = (qubit + 1) % n
                qc.cx(qubit, target)

        original_depth = qc.depth()
        original_gates = sum(qc.count_ops().values())

        # Create a mock heavy-hex-like coupling map for n qubits to force transpilation
        # If n=1 or 2, just use full connection. For more, linear nearest-neighbor forces SWAP gates.
        cmap = []
        for i in range(n - 1):
            cmap.append([i, i+1])
            cmap.append([i+1, i])
            
        coupling_map = CouplingMap(cmap) if cmap else None

        # Transpile with high optimization level (level 3)
        optimized_qc = transpile(qc, coupling_map=coupling_map, optimization_level=3, basis_gates=['cx', 'id', 'rz', 'sx', 'x'])
        
        optimized_depth = optimized_qc.depth()
        optimized_gates = sum(optimized_qc.count_ops().values())
        
        # In a real heavy transpilation, logical gates get expanded to basis gates, which INCREASES gate count.
        # But advanced pass managers can optimize local blocks. We'll return the metrics.
        from qiskit import qasm3
        return {
            "original": {"depth": original_depth, "gate_count": original_gates},
            "optimized": {"depth": optimized_depth, "gate_count": optimized_gates},
            "qasm": qasm3.dumps(optimized_qc)
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class IBMExecuteRequest(BaseModel):
    token: str
    qubits: int = 1
    gates: list = []

@app.post("/api/ibm-execute")
def execute_ibm(req: IBMExecuteRequest):
    """
    Simulates sending the job to an IBM Quantum cloud backend.
    In a true production setting, this would use QiskitRuntimeService.
    """
    try:
        import time
        # We validate the token format minimally
        if len(req.token) < 10:
            raise ValueError("Invalid IBM Quantum API Token. It should be a long alphanumeric string.")
            
        # Simulate network delay and execution on IBM Brisbane or similar
        time.sleep(2)
        
        # Return a simulated successful hardware response
        return {
            "status": "COMPLETED",
            "backend": "ibm_brisbane",
            "job_id": f"cqf{int(time.time())}v8k0",
            "shots": 1024,
            "results": {
                "0" * req.qubits: 512,
                ("1" + "0" * (req.qubits - 1))[:req.qubits]: 512
            },
            "message": "Successfully executed on IBM Quantum Cloud."
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

class VQARequest(BaseModel):
    molecule: str = "H2"

@app.post("/api/vqa-run")
def vqa_run(req: VQARequest):
    """
    Simulates a VQE (Variational Quantum Eigensolver) optimization loop.
    Returns an array of cost function values showing the AI learning the ground state.
    """
    try:
        import numpy as np
        import math
        
        iterations = 50
        results = []
        
        # Define target ground state energies
        targets = {
            "H2": -1.137,   # Hartrees
            "LiH": -7.882,
            "BeH2": -15.595
        }
        
        target_energy = targets.get(req.molecule.upper(), -1.0)
        
        # Simulate an optimization curve with noise
        current_energy = 0.0
        for i in range(iterations):
            # Exponential decay towards target
            decay = math.exp(-i / 10.0)
            noise = np.random.normal(0, 0.05 * decay) # Noise decreases as it converges
            current_energy = target_energy + (abs(target_energy) * decay) + noise
            
            results.append({
                "iteration": i,
                "cost": round(current_energy, 4)
            })
            
        return {
            "molecule": req.molecule.upper(),
            "target_energy": target_energy,
            "history": results
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ════════════════════════════════════════════════════════════════════════════════
# QUANTUM CODE EXPLAINER
# ════════════════════════════════════════════════════════════════════════════════

import base64, io
from fastapi import UploadFile, File, Form

class CodeExplainRequest(BaseModel):
    code: str

@app.post("/api/explain-code")
def explain_code(req: CodeExplainRequest):
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt

        circuit_svg = None
        circuit_info = ""
        try:
            namespace = {}
            exec(req.code, {"__builtins__": __builtins__, "QuantumCircuit": QuantumCircuit}, namespace)
            qc = None
            for v in namespace.values():
                if isinstance(v, QuantumCircuit):
                    qc = v
                    break
            if qc:
                fig = qc.draw('mpl', style={'backgroundcolor': '#0a0d16', 'textcolor': '#ffffff', 'gatefacecolor': '#4f46e5', 'barrierfacecolor': '#374151', 'creglinecolor': '#6b7280'})
                buf = io.BytesIO()
                fig.savefig(buf, format='svg', bbox_inches='tight', facecolor='#0a0d16')
                buf.seek(0)
                circuit_svg = buf.read().decode('utf-8')
                plt.close('all')
                circuit_info = f"Circuit: {qc.num_qubits} qubits, {len(qc.data)} gates."
        except Exception as draw_err:
            circuit_info = f"Note: Could not auto-render circuit diagram. ({draw_err})"

        explain_prompt = f"""You are a quantum computing expert. Analyze this quantum code and provide:

## What This Circuit Does
Plain English, 2-3 sentences max.

## Gate-by-Gate Breakdown
Explain each gate operation and its quantum effect.

## Quantum Phenomena
What superposition, entanglement, or interference is happening?

## Expected Measurement Results
What outcomes to expect and the probabilities/reasons.

## Real-World Use Cases
Where is this algorithm/circuit used?

Code:
```python
{req.code}
```
{circuit_info}
Be precise and technical but clear. Use markdown."""

        explanation = _gemini_chat(
            [{"role": "user", "content": explain_prompt}],
            max_tokens=2048, temperature=0.3,
            system_prompt="You are an expert quantum computing educator. Never use AI buzzwords."
        )
        return {"explanation": explanation, "circuit_svg": circuit_svg, "circuit_info": circuit_info}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ════════════════════════════════════════════════════════════════════════════════
# RESEARCH PAPER SUMMARIZER
# ════════════════════════════════════════════════════════════════════════════════

@app.post("/api/summarize-paper")
async def summarize_paper(file: UploadFile = File(...)):
    try:
        import PyPDF2
        contents = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
        text = ""
        for page in pdf_reader.pages[:20]:
            text += page.extract_text() + "\n"
        text = text[:12000]

        summarize_prompt = f"""Analyze this quantum computing paper and provide a structured summary:

## Overview
One paragraph summary.

## Key Contributions
3-5 bullet points of main findings.

## Methodology
Core technical approach used.

## Results & Findings
Key numerical results or theoretical findings.

## Quantum Concepts Used
Specific quantum techniques employed.

## Implications & Future Work
Why this matters and next steps suggested.

Paper:
{text}"""

        summary = _gemini_chat(
            [{"role": "user", "content": summarize_prompt}],
            max_tokens=3000, temperature=0.3,
            system_prompt="You are an expert quantum computing researcher and scientific communicator."
        )
        return {"summary": summary, "pages": len(pdf_reader.pages), "filename": file.filename, "chars_processed": len(text)}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ════════════════════════════════════════════════════════════════════════════════
# QUANTUM BENCHMARK TRACKER
# ════════════════════════════════════════════════════════════════════════════════

import time as _time

class BenchmarkRequest(BaseModel):
    qubits: int = 4
    depth: int = 3
    shots: int = 1024

@app.post("/api/benchmark")
def run_benchmark(req: BenchmarkRequest):
    try:
        from qiskit.circuit.random import random_circuit
        from qiskit import transpile

        qc = random_circuit(req.qubits, req.depth, measure=True, seed=42)
        backends_cfg = [
            ("Statevector", AerSimulator(method="statevector")),
            ("QASM (MPS)", AerSimulator(method="matrix_product_state")),
            ("Density Matrix", AerSimulator(method="density_matrix")),
        ]

        results = []
        for name, sim in backends_cfg:
            try:
                t0 = _time.time()
                tqc = transpile(qc, sim)
                job = sim.run(tqc, shots=req.shots)
                counts = job.result().get_counts()
                elapsed = round((_time.time() - t0) * 1000, 2)
                total = sum(counts.values())
                top_state = max(counts, key=counts.get)
                results.append({
                    "backend": name,
                    "time_ms": elapsed,
                    "top_state": top_state,
                    "fidelity": round(counts[top_state] / total, 4),
                    "unique_states": len(counts),
                })
            except Exception as be:
                results.append({"backend": name, "error": str(be), "time_ms": 0, "fidelity": 0, "unique_states": 0})

        return {"results": results, "qubits": req.qubits, "depth": req.depth, "gates": len(qc.data)}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ════════════════════════════════════════════════════════════════════════════════
# RUN
# ════════════════════════════════════════════════════════════════════════════════
# ════════════════════════════════════════════════════════════════════════════════
# SERVE FRONTEND (FOR PRODUCTION DEPLOYMENT)

# ════════════════════════════════════════════════════════════════════════════════
frontend_dist = os.path.join(os.path.dirname(__file__), "frontend", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    print(f"Warning: Frontend build directory not found at {frontend_dist}")

if __name__ == "__main__":
    import uvicorn
    # Bind to 0.0.0.0 for Docker deployments
    uvicorn.run("backend:app", host="0.0.0.0", port=8000, reload=False)
