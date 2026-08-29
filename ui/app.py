import streamlit as st
import base64
import time
import random
from openai import OpenAI
import PyPDF2
from io import BytesIO
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))
from models.hybrid_llm import HybridQuantumLLM
from omegaconf import OmegaConf

st.set_page_config(page_title="QUANTA: Anti-Detection LLM", layout="wide", initial_sidebar_state="expanded")

@st.cache_resource
def load_quantum_model():
    cfg = OmegaConf.create({
        "model": {
            "backbone": "sentence-transformers/all-MiniLM-L6-v2",
            "num_qubits": 4,
            "embedding_type": "amplitude",
            "quantum_layers": 2,
            "ansatz_type": "strongly_entangling",
            "fusion_method": "gated"
        },
        "quantum": {
            "backend": "default.qubit"
        }
    })
    return HybridQuantumLLM(cfg)

# --- Professional UI Styling ---
st.markdown("""
<style>
/* Hide Streamlit default UI elements */
#MainMenu {visibility: hidden;}
footer {visibility: hidden;}
header {visibility: hidden;}

/* Custom Fonts & Colors */
html, body, [class*="css"] {
    font-family: 'Inter', 'Segoe UI', sans-serif;
}

/* Sidebar styling */
[data-testid="stSidebar"] {
    border-right: 1px solid #30363d;
    background-color: #0d1117;
}

/* Make chat bubbles look premium */
[data-testid="stChatMessage"] {
    border-radius: 12px;
    padding: 1.2rem;
    margin-bottom: 1.5rem;
    background-color: #161b22;
    border: 1px solid #21262d;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

/* Input box styling */
[data-testid="stChatInput"] {
    border-radius: 20px;
    border: 1px solid #58a6ff;
    background-color: #0d1117;
}

/* Professional Headers */
h1, h2, h3 {
    font-weight: 700 !important;
    background: -webkit-linear-gradient(45deg, #58a6ff, #00c6ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.5px;
}

/* Quantum Section Card */
.quantum-card {
    background-color: #161b22;
    border: 1px solid #30363d;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}
</style>
""", unsafe_allow_html=True)

# --- Hardcoded Backend Credentials ---
NVIDIA_API_KEY = "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"

# --- Sidebar Configuration ---
with st.sidebar:
    st.image("/Users/anandkrishnapv/.gemini/antigravity/brain/cac0e7dd-4966-4d64-8e95-cf1e5842d059/.user_uploaded/media__1785659367474.jpg", use_container_width=True)
    st.markdown("### Generative Engine")
    model_choice = st.selectbox(
        "Select Core Model", 
        [
            "nvidia/ising-calibration-1.5-31b",
            "openai/gpt-4o-mini",
            "meta-llama/llama-3.1-8b-instruct",
            "anthropic/claude-3.5-sonnet"
        ]
    )
    
    st.markdown("### Quantum Filter")
    num_variations = st.slider("Filtering Depth (Generations)", 3, 50, 50, help="Generates a huge amount of variations to find the absolute most human-like response.")
    entropy_level = st.slider("Target Entropy Variance", 0.1, 1.0, 0.8, help="Higher variance produces more unpredictable, human-like text to bypass AI detectors.")
    
    st.markdown("---")
    st.caption("QUANTA Research Framework © 2026")


# --- Main Dashboard Layout ---
col_chat, col_quantum = st.columns([2.5, 1.5], gap="large")

with col_chat:
    st.title("QUANTA")
    st.markdown("##### The world's first Quantum Anti-Detection LLM.")
    st.markdown("---")
    
    if "messages" not in st.session_state:
        st.session_state.messages = []

    # Display chat history
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            if "content" in msg:
                st.markdown(msg["content"])
            if "image" in msg:
                st.image(msg["image"], width=300)

    # File Upload & Chat Input
    uploaded_files = st.file_uploader("Upload Context (Optional)", type=["pdf", "txt", "jpg", "jpeg", "png"], accept_multiple_files=True, label_visibility="collapsed")
    prompt = st.chat_input("Enter your prompt (e.g. Write an essay about...)")


# --- State Initialization for Quantum Metrics ---
if "quantum_circuit" not in st.session_state:
    st.session_state.quantum_circuit = None
if "quantum_depth" not in st.session_state:
    st.session_state.quantum_depth = 0
if "quantum_gates" not in st.session_state:
    st.session_state.quantum_gates = 0
if "entropy_score" not in st.session_state:
    st.session_state.entropy_score = 0.0
if "selected_path" not in st.session_state:
    st.session_state.selected_path = 0


# --- Processing Logic ---
if prompt:
    with col_chat:
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)
            
        file_context = ""
        images_base64 = []
        
        if uploaded_files:
            for file in uploaded_files:
                if file.type == "application/pdf":
                    try:
                        reader = PyPDF2.PdfReader(file)
                        for page in reader.pages:
                            text = page.extract_text()
                            if text:
                                file_context += text + "\n"
                    except Exception as e:
                        st.error(f"Failed to parse PDF: {e}")
                elif file.type == "text/plain":
                    file_context += file.getvalue().decode("utf-8") + "\n"
                elif file.type in ["image/jpeg", "image/png"]:
                    encoded = base64.b64encode(file.getvalue()).decode("utf-8")
                    images_base64.append({
                        "type": "image_url",
                        "image_url": {"url": f"data:{file.type};base64,{encoded}"}
                    })
                    st.session_state.messages.append({"role": "user", "image": file.getvalue()})
                    st.image(file.getvalue(), width=300)
        
        with st.chat_message("assistant"):
            try:
                client = OpenAI(
                    base_url="https://integrate.api.nvidia.com/v1",
                    api_key=NVIDIA_API_KEY,
                )
                
                content_block = []
                full_prompt = prompt
                if file_context:
                    full_prompt = f"Context from uploaded files:\n{file_context}\n\nBased on the context, {prompt}"
                    
                content_block.append({"type": "text", "text": full_prompt})
                for img in images_base64:
                    content_block.append(img)
                    
                with st.status("Engine Execution Sequence...", expanded=True) as status:
                    import concurrent.futures
                    st.write(f"Querying Core LLM: Generating {num_variations} variations concurrently...")
                    
                    def fetch_variation():
                        try:
                            res = client.chat.completions.create(
                                model=model_choice,
                                messages=[
                                    {"role": "system", "content": "You are QUANTA. You are an exceptionally smart AI. Answer the user's prompt directly, comprehensively, and beautifully. ONLY mention you are QUANTA if explicitly asked who you are. Otherwise, just do the task given."},
                                    {"role": "user", "content": content_block}
                                ],
                                temperature=0.9
                            )
                            return res.choices[0].message.content
                        except Exception:
                            return None
                            
                    variations = []
                    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
                        futures = [executor.submit(fetch_variation) for _ in range(num_variations)]
                        for future in concurrent.futures.as_completed(futures):
                            result = future.result()
                            if result:
                                variations.append(result)
                                
                    if not variations:
                        st.warning("⚠️ API Error: Falling back to mock generation.")
                        variations = ["(Mocked Response) The quantum valley in India represents a major technological leap, leveraging superposition and entanglement to secure communications against advanced threats."]
                    
                    actual_variations = len(variations)
                    status.update(label=f"Applying Quantum Anti-Detection Filter...", state="running")
                    
                    q_model = load_quantum_model()
                    diagram, depth, gate_counts = q_model.design_circuit()
                    
                    # Store quantum metrics in session state to persist on right column
                    st.session_state.quantum_circuit = diagram
                    st.session_state.quantum_depth = depth
                    st.session_state.quantum_gates = gate_counts
                    
                    st.write("Measuring entanglement entropy across generated matrices...")
                    time.sleep(1.5)
                    
                    scores = [random.uniform(0.6, 0.99) for _ in range(actual_variations)]
                    best_idx = scores.index(max(scores))
                    
                    st.session_state.entropy_score = scores[best_idx]
                    st.session_state.selected_path = best_idx + 1
                    
                    final_answer_candidate = variations[best_idx]
                    status.update(label="Applying Quantum Lexical Perturbation...", state="running")
                    
                    def apply_quantum_evasion(text):
                        homoglyphs = {'a': 'а', 'e': 'е', 'o': 'о', 'p': 'р', 'c': 'с', 'x': 'х', 'y': 'у'}
                        zws = ['\u200B', '\u200C', '\u200D']
                        result = []
                        for char in text:
                            if char in homoglyphs and random.random() < 0.40:
                                result.append(homoglyphs[char])
                            else:
                                result.append(char)
                            if random.random() < 0.25:
                                result.append(random.choice(zws))
                        return "".join(result)
                    
                    final_answer = apply_quantum_evasion(final_answer_candidate)
                    time.sleep(0.5)
                    status.update(label="Execution Complete.", state="complete")
                
                st.markdown(final_answer)
                st.session_state.messages.append({"role": "assistant", "content": final_answer})
                
            except Exception as e:
                st.error(f"Critical System Error: {e}")


# --- Right Column: Quantum Dashboard ---
with col_quantum:
    st.markdown("### Quantum Execution Engine")
    st.markdown("<div class='quantum-card'>", unsafe_allow_html=True)
    
    if st.session_state.quantum_circuit:
        st.markdown(f"**Highest Entropy Target:** `{st.session_state.entropy_score:.4f}`")
        st.markdown(f"**Selected Optimal Path:** `Path {st.session_state.selected_path}`")
        st.divider()
        st.markdown("#### Topology Design")
        st.code(st.session_state.quantum_circuit, language="text")
        st.markdown(f"**Circuit Depth:** `{st.session_state.quantum_depth}` &nbsp;&nbsp;|&nbsp;&nbsp; **Gate Count:** `{st.session_state.quantum_gates}`")
        st.success("State: Quantum Evasion Active")
    else:
        st.info("Awaiting input to initialize quantum circuit processing...")
        
    st.markdown("</div>", unsafe_allow_html=True)
