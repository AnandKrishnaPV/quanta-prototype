// QATION API client — calls Netlify serverless functions (always online, no backend server needed)
// arXiv search runs directly in the browser (arXiv allows CORS)

const BASE = import.meta.env.DEV ? 'http://localhost:8000' : '';

// ─── Chat ─────────────────────────────────────────────────────────────────────
export async function sendChat(messages, model = 'meta/llama-3.1-70b-instruct', options = {}) {
  try {
    const res = await fetch(`${BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model, max_tokens: 2048, temperature: 0.7, ...options }),
      signal: AbortSignal.timeout(12000), // 12s client timeout
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Chat API error ${res.status}`);
    }
    return res.json();
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new Error('Response timed out. Please try a shorter message or try again.');
    }
    throw err;
  }
}

// ─── Quantum Simulation ───────────────────────────────────────────────────────
export async function simulateCircuit(payload) {
  // payload: { qubits, gates: [{qubit, slot, gate}], shots }
  const res = await fetch(`${BASE}/api/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Simulate API error ${res.status}`);
  }
  return res.json();
  // { success, probabilities:[{state, probability}], counts, depth, gate_count, qiskit_code }
}

// ─── Bloch Sphere (Real Qiskit) ───────────────────────────────────────────────
export async function fetchBlochSphere(qubits, gates) {
  const res = await fetch(`${BASE}/api/bloch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qubits, gates }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Bloch API error ${res.status}`);
  }
  return res.json(); // { bloch_vectors: [{qubit, x, y, z, ...}], qubits }
}

// ─── Enterprise Features ──────────────────────────────────────────────────────

export async function transpileCircuit(qubits, gates) {
  const res = await fetch(`${BASE}/api/transpile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qubits, gates })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Transpile API error ${res.status}`);
  }
  return res.json(); // { original, optimized, qasm }
}

export async function executeIBM(token, qubits, gates) {
  const res = await fetch(`${BASE}/api/ibm-execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, qubits, gates })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `IBM API error ${res.status}`);
  }
  return res.json(); // { status, backend, job_id, results, message }
}

export async function runVQA(molecule = "H2") {
  const res = await fetch(`${BASE}/api/vqa-run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ molecule })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `VQA API error ${res.status}`);
  }
  return res.json(); // { molecule, target_energy, history }
}

// ─── Research (OpenAlex — free, no key, full CORS support) ───────────────────
export async function searchResearch(query, max_results = 6) {
  // OpenAlex supports CORS from browsers natively
  const url = new URL('https://api.openalex.org/works');
  url.searchParams.set('search', query);
  url.searchParams.set('per-page', String(max_results));
  url.searchParams.set('sort', 'relevance_score:desc');
  url.searchParams.set(
    'select',
    'id,title,abstract_inverted_index,authorships,publication_year,doi,open_access,primary_location,topics'
  );
  url.searchParams.set('mailto', 'anandkrishnapv@gmail.com');


  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'QATION Platform (https://qation.ai)' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`OpenAlex API error ${res.status}`);

  const data = await res.json();

  // Reconstruct abstract from OpenAlex inverted index format
  function rebuildAbstract(inv) {
    if (!inv) return 'Abstract not available.';
    const words = [];
    for (const [word, positions] of Object.entries(inv)) {
      for (const pos of positions) words[pos] = word;
    }
    return words.join(' ').slice(0, 350) + '…';
  }

  const papers = (data.results || []).map(p => {
    const authors = (p.authorships || [])
      .slice(0, 3)
      .map(a => a.author?.display_name || '')
      .filter(Boolean);

    const doi = p.doi ? `https://doi.org/${p.doi.replace('https://doi.org/', '')}` : null;
    const pdfUrl = p.open_access?.oa_url || doi || p.id;
    const topic = p.topics?.[0]?.display_name || '';

    return {
      title:    (p.title || 'Untitled').replace(/\s+/g, ' ').trim(),
      summary:  rebuildAbstract(p.abstract_inverted_index),
      url:      pdfUrl || p.id,
      authors,
      date:     p.publication_year ? String(p.publication_year) : '',
      category: topic,
      arxiv_id: p.id?.split('/').pop() || '',
      isOpenAccess: p.open_access?.is_oa || false,
    };
  });

  return { papers, total: data.meta?.count ?? papers.length };
}


// ─── Health check ─────────────────────────────────────────────────────────────
export async function checkHealth() {
  try {
    const res = await fetch(`${BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Workspace (Real Filesystem) ──────────────────────────────────────────────
export async function fetchWorkspace() {
  const res = await fetch(`${BASE}/api/workspace`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Workspace API error ${res.status}`);
  }
  return res.json(); // { files: [...], total, total_mb, folders }
}

// ─── Marketplace (GitHub Repos) ───────────────────────────────────────────────
export async function fetchGithubPackages(query = 'qiskit') {
  // Free GitHub API without auth
  const url = new URL('https://api.github.com/search/repositories');
  url.searchParams.set('q', `${query} in:name,description`);
  url.searchParams.set('sort', 'stars');
  url.searchParams.set('per_page', '12');

  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/vnd.github.v3+json' }
  });
  if (!res.ok) throw new Error(`GitHub API error ${res.status}`);
  const data = await res.json();

  return (data.items || []).map(repo => ({
    name: repo.name,
    desc: repo.description || 'No description provided.',
    author: `@${repo.owner.login}`,
    stars: repo.stargazers_count,
    url: repo.html_url,
    language: repo.language || 'Python',
    topics: repo.topics || []
  }));
}

// ─── Notebook Execution ───────────────────────────────────────────────────────
export async function executeCode(code) {
  const res = await fetch(`${BASE}/api/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Execution API error ${res.status}`);
  }
  return res.json(); // { output, time, success }
}

// ─── AI Circuit Synthesis ─────────────────────────────────────────────────────
export async function synthesizeCircuit(prompt) {
  const res = await fetch(`${BASE}/api/circuit-synthesis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Synthesis API error ${res.status}`);
  }
  return res.json();
  // { description, num_qubits, gates: [{qubit, slot, gate}], code }
}
