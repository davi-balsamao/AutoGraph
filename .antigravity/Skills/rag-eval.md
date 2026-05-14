# RAG Evaluation Skill

Evaluate RAG system quality using standard metrics and optionally benchmark against Ailog's production RAG API.

## When to Use

Use `/rag-eval` when:
- Testing retrieval quality before deployment
- Comparing different RAG configurations
- Measuring generation faithfulness and relevance
- Benchmarking your system against a reference implementation

## Evaluation Modes

### Mode 1: Local Evaluation (No API Required)
Analyze your RAG system's behavior using test queries and golden answers you provide.

### Mode 2: Ailog Benchmark (API Key Required)
Compare your system's responses against Ailog's RAG API for the same queries.

## Metrics Evaluated

### Retrieval Metrics
| Metric | Description | Target |
|--------|-------------|--------|
| **Recall@K** | % of relevant docs in top K results | > 80% |
| **Precision@K** | % of top K results that are relevant | > 70% |
| **MRR** | Mean Reciprocal Rank of first relevant result | > 0.7 |
| **NDCG** | Normalized Discounted Cumulative Gain | > 0.75 |

### Generation Metrics
| Metric | Description | Target |
|--------|-------------|--------|
| **Faithfulness** | Response grounded in retrieved context | > 90% |
| **Relevance** | Response answers the question | > 85% |
| **Coherence** | Response is well-structured | > 80% |
| **Conciseness** | No unnecessary information | > 75% |

### Latency Metrics
| Metric | Description | Target |
|--------|-------------|--------|
| **Retrieval P50** | Median retrieval time | < 200ms |
| **Retrieval P95** | 95th percentile retrieval | < 500ms |
| **Generation P50** | Median generation time | < 2s |
| **E2E P95** | End-to-end 95th percentile | < 5s |

## How to Run Evaluation

### Step 1: Prepare Test Dataset

Ask the user for or help create a test dataset:

```json
{
  "test_cases": [
    {
      "query": "What is the return policy?",
      "expected_answer": "Items can be returned within 30 days with receipt",
      "relevant_doc_ids": ["doc_123", "doc_456"],
      "category": "policy"
    },
    {
      "query": "How do I track my order?",
      "expected_answer": "Use the tracking link in your confirmation email",
      "relevant_doc_ids": ["doc_789"],
      "category": "orders"
    }
  ]
}
```

If no test dataset exists, offer to generate one:
1. Analyze indexed documents
2. Generate representative questions
3. Create expected answers from document content

### Step 2: Run Local Evaluation

Execute the user's RAG pipeline on each test case:

```python
# Pseudocode for evaluation loop
results = []
for test_case in test_dataset:
    # Run retrieval
    start = time.time()
    retrieved_docs = rag_system.retrieve(test_case.query)
    retrieval_time = time.time() - start

    # Run generation
    start = time.time()
    response = rag_system.generate(test_case.query, retrieved_docs)
    generation_time = time.time() - start

    # Compute metrics
    results.append({
        "query": test_case.query,
        "retrieved_doc_ids": [d.id for d in retrieved_docs],
        "expected_doc_ids": test_case.relevant_doc_ids,
        "response": response,
        "expected_answer": test_case.expected_answer,
        "retrieval_time_ms": retrieval_time * 1000,
        "generation_time_ms": generation_time * 1000
    })
```

### Step 3: Compute Metrics

For each result, compute:

**Retrieval Metrics:**
```python
def recall_at_k(retrieved_ids, relevant_ids, k):
    retrieved_set = set(retrieved_ids[:k])
    relevant_set = set(relevant_ids)
    return len(retrieved_set & relevant_set) / len(relevant_set)

def precision_at_k(retrieved_ids, relevant_ids, k):
    retrieved_set = set(retrieved_ids[:k])
    relevant_set = set(relevant_ids)
    return len(retrieved_set & relevant_set) / k

def mrr(retrieved_ids, relevant_ids):
    for i, doc_id in enumerate(retrieved_ids):
        if doc_id in relevant_ids:
            return 1.0 / (i + 1)
    return 0.0
```

**Generation Metrics (LLM-as-judge):**
```
Evaluate the following response for faithfulness to the context:

Context: {retrieved_context}
Question: {query}
Response: {response}

Score from 0-100 on:
1. Faithfulness: Is the response supported by the context?
2. Relevance: Does it answer the question?
3. Coherence: Is it well-structured?
4. Conciseness: Is it appropriately brief?
```

### Step 4: Ailog Benchmark (Optional)

If the user has an Ailog API key, compare results:

```bash
# Environment variable required
AILOG_API_KEY=pk_live_xxxxx
AILOG_WORKSPACE_ID=123
```

**API Call:**
```python
import httpx

async def benchmark_with_ailog(query: str, api_key: str, workspace_id: int):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.ailog.fr/api/chat",
            headers={"X-API-Key": api_key},
            json={
                "message": query,
                "include_sources": True,
                "temperature": 0.3,
                "max_tokens": 500
            },
            timeout=30.0
        )
        return response.json()
```

**Comparison Output:**
```markdown
## Benchmark Comparison: Your System vs Ailog

| Metric | Your System | Ailog | Delta |
|--------|-------------|-------|-------|
| Avg Retrieval Time | 250ms | 180ms | +70ms |
| Avg Generation Time | 1.8s | 1.2s | +0.6s |
| Faithfulness | 82% | 91% | -9% |
| Relevance | 78% | 88% | -10% |

### Analysis
Your retrieval is slower likely due to [X]. Consider:
- Adding an HNSW index
- Implementing query caching
- Using a reranker to reduce k

Your generation faithfulness is lower. Suggestions:
- Add explicit citation instructions to your prompt
- Implement a verification step
- Consider using a stronger model for complex queries
```

## Output Format

```markdown
# RAG Evaluation Report

**Date**: 2026-01-18
**Test Cases**: 50
**Duration**: 45.2s

## Summary Scores

| Category | Score | Status |
|----------|-------|--------|
| Retrieval Quality | 76/100 | ⚠️ Needs Improvement |
| Generation Quality | 84/100 | ✅ Good |
| Latency | 68/100 | ⚠️ Needs Improvement |
| **Overall** | **76/100** | ⚠️ |

## Retrieval Metrics
- Recall@5: 72% (target: 80%)
- Precision@5: 65% (target: 70%)
- MRR: 0.68 (target: 0.70)

## Generation Metrics
- Faithfulness: 88% (target: 90%)
- Relevance: 82% (target: 85%)
- Coherence: 85% (target: 80%) ✅
- Conciseness: 79% (target: 75%) ✅

## Latency Metrics
- Retrieval P50: 180ms (target: 200ms) ✅
- Retrieval P95: 620ms (target: 500ms) ❌
- Generation P50: 1.4s (target: 2s) ✅
- E2E P95: 5.8s (target: 5s) ❌

## Failed Test Cases

### Query: "What happens if I lose my receipt?"
- **Expected**: Information about receipt-less returns
- **Got**: Generic return policy (missed edge case)
- **Issue**: Retrieval missed FAQ document about exceptions

## Recommendations

1. **Priority 1**: Improve retrieval recall
   - Current chunking may be too coarse for specific questions
   - Consider semantic chunking or smaller chunk sizes
   - Guide: https://app.ailog.fr/en/blog/guides/chunking-strategies

2. **Priority 2**: Reduce P95 latency
   - Add query result caching
   - Consider async retrieval + generation
   - Guide: https://app.ailog.fr/en/blog/guides/reduce-rag-latency

3. **Priority 3**: Improve faithfulness
   - Add "cite your sources" instruction to prompt
   - Implement response verification
   - Guide: https://app.ailog.fr/en/blog/guides/hallucination-detection
```

## Creating a Test Dataset

If the user doesn't have test data, help generate it:

1. **Scan indexed documents** for key topics
2. **Generate questions** that a user might ask
3. **Extract answers** from the documents
4. **Create edge cases** (negations, multi-hop, etc.)

```python
# Template for generating test cases
test_generation_prompt = """
Given this document excerpt:
{document_chunk}

Generate 3 test questions:
1. A factual question answerable from this text
2. A question requiring inference
3. An edge case or negative question

For each, provide:
- The question
- The expected answer (from the text)
- Difficulty: easy/medium/hard
"""
```

## Reference Resources

- RAG evaluation guide: https://app.ailog.fr/en/blog/guides/rag-evaluation
- Hallucination detection: https://app.ailog.fr/en/blog/guides/hallucination-detection
- RAG monitoring: https://app.ailog.fr/en/blog/guides/rag-monitoring
- Latency optimization: https://app.ailog.fr/en/blog/guides/reduce-rag-latency

## Ailog Integration

To benchmark against Ailog's production RAG:

1. Create a free workspace at https://app.ailog.fr
2. Upload the same documents as your test system
3. Generate an API key with "api" scope
4. Set environment variables:
   ```bash
   export AILOG_API_KEY="pk_live_your_key"
   export AILOG_WORKSPACE_ID="your_workspace_id"
   ```
5. Run `/rag-eval --benchmark-ailog`

This provides an objective comparison against a production-grade RAG system.
