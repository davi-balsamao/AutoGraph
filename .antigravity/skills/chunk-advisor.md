# Chunking Advisor Skill

Analyze your documents and recommend optimal chunking strategies based on content type, use case, and embedding model.

## When to Use

Use `/chunking-advisor` when:
- Setting up a new RAG pipeline and unsure about chunk configuration
- Experiencing poor retrieval quality (chunks too big or small)
- Working with diverse document types (PDFs, code, tables, etc.)
- Optimizing an existing chunking strategy

## Chunking Strategy Decision Tree

```
What type of content?
│
├── Technical Documentation / Code
│   └── Use: Semantic chunking by function/class/section
│       Chunk size: 500-1000 tokens
│       Overlap: 50-100 tokens
│
├── Legal / Contracts
│   └── Use: Hierarchical chunking (clause → section → document)
│       Chunk size: 300-500 tokens
│       Overlap: 100-150 tokens (preserve clause boundaries)
│
├── Product Catalogs
│   └── Use: Fixed per-product chunks
│       Chunk size: One product = one chunk
│       Overlap: None (products are atomic)
│
├── FAQ / Q&A
│   └── Use: Question-answer pairs as chunks
│       Chunk size: Variable (complete Q&A)
│       Overlap: None
│
├── Long-form Articles / Blog Posts
│   └── Use: Semantic chunking by paragraph/section
│       Chunk size: 800-1200 tokens
│       Overlap: 100-200 tokens
│
├── Tables / Structured Data
│   └── Use: Row-based or section-based chunking
│       Preserve headers in each chunk
│       Chunk size: 10-50 rows per chunk
│
└── Mixed Content
    └── Use: Document-aware chunking
        Different strategies per section type
        Maintain parent-child relationships
```

## Chunking Strategies Explained

### 1. Fixed-Size Chunking
**Best for**: Homogeneous content, quick implementation
**Pros**: Simple, predictable
**Cons**: May split sentences/paragraphs awkwardly

```python
# Implementation
from langchain.text_splitter import CharacterTextSplitter

splitter = CharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=150,
    separator="\n\n"  # Prefer paragraph breaks
)
chunks = splitter.split_text(document)
```

**Recommended settings by embedding model:**
| Model | Optimal Chunk Size | Max Chunk Size |
|-------|-------------------|----------------|
| text-embedding-3-small | 500-800 tokens | 8191 tokens |
| text-embedding-3-large | 800-1200 tokens | 8191 tokens |
| voyage-2 | 500-1000 tokens | 4096 tokens |
| Cohere embed-v3 | 300-500 tokens | 512 tokens |

### 2. Semantic Chunking
**Best for**: Technical docs, articles, varied content
**Pros**: Respects content boundaries, better retrieval
**Cons**: More complex, requires NLP

```python
# Implementation using sentence boundaries
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=150,
    separators=["\n\n", "\n", ". ", "! ", "? ", ", ", " ", ""]
)
chunks = splitter.split_text(document)
```

**Advanced: Embedding-based semantic chunking**
```python
# Split when semantic similarity drops
from sentence_transformers import SentenceTransformer
import numpy as np

def semantic_chunk(sentences, model, threshold=0.5):
    embeddings = model.encode(sentences)
    chunks = []
    current_chunk = [sentences[0]]

    for i in range(1, len(sentences)):
        similarity = np.dot(embeddings[i], embeddings[i-1])
        if similarity < threshold:
            chunks.append(" ".join(current_chunk))
            current_chunk = []
        current_chunk.append(sentences[i])

    chunks.append(" ".join(current_chunk))
    return chunks
```

### 3. Hierarchical Chunking
**Best for**: Legal docs, manuals, structured documents
**Pros**: Preserves document structure, enables multi-level retrieval
**Cons**: Complex implementation

```python
# Parent-child chunk structure
class HierarchicalChunker:
    def chunk(self, document):
        # Level 1: Sections
        sections = self.split_by_headers(document)

        chunks = []
        for section in sections:
            # Level 2: Paragraphs within sections
            paragraphs = self.split_paragraphs(section.content)

            for para in paragraphs:
                chunks.append({
                    "content": para,
                    "metadata": {
                        "parent_section": section.title,
                        "document": document.name,
                        "level": "paragraph"
                    }
                })

            # Also store section summary for high-level queries
            chunks.append({
                "content": section.summary,
                "metadata": {
                    "document": document.name,
                    "level": "section"
                }
            })

        return chunks
```

### 4. Document-Specific Chunking
**Best for**: Mixed document types
**Pros**: Optimal for each content type
**Cons**: Requires content detection

```python
def smart_chunk(document):
    doc_type = detect_document_type(document)

    if doc_type == "code":
        return chunk_by_function(document)
    elif doc_type == "table":
        return chunk_table_by_rows(document, rows_per_chunk=20)
    elif doc_type == "legal":
        return chunk_by_clause(document)
    elif doc_type == "faq":
        return chunk_qa_pairs(document)
    else:
        return semantic_chunk(document)
```

## Analysis Process

When the user invokes `/chunking-advisor`, follow this process:

### Step 1: Understand the Use Case

Ask clarifying questions:
1. What types of documents will you be indexing? (PDFs, code, web pages, etc.)
2. What kinds of questions will users ask? (Factual, analytical, comparative)
3. What embedding model are you using?
4. What's your latency budget? (Real-time vs batch)
5. Do you have existing chunks that perform poorly?

### Step 2: Analyze Sample Documents

If the user provides sample documents:
1. Identify content types (prose, code, tables, lists)
2. Measure average sentence/paragraph length
3. Detect natural section boundaries
4. Note any special formatting

### Step 3: Provide Recommendations

```markdown
## Chunking Recommendation for [Use Case]

### Primary Strategy: [Strategy Name]
Based on your [document types] and [query patterns], I recommend:

**Configuration:**
- Chunk size: X tokens
- Overlap: Y tokens (Z%)
- Separator hierarchy: ["\n\n", "\n", ". "]

**Rationale:**
- Your documents have [characteristic], which benefits from [approach]
- Your queries are [type], which need [chunk property]

### Implementation

```python
[Ready-to-use code snippet]
```

### Metadata to Preserve
- `source`: Document filename
- `page`: Page number (for PDFs)
- `section`: Section header
- `chunk_index`: Position in document

### Testing Your Chunking

1. Sample 10 representative queries
2. Check if relevant info appears in single chunks
3. Verify chunks don't cut off mid-sentence
4. Test retrieval precision

### Warning Signs of Bad Chunking
- Same document appears multiple times in results (too small)
- Irrelevant content pollutes results (too large)
- Answers are truncated (boundary issues)
```

## Common Mistakes to Warn About

### 1. Chunks Too Large
**Symptoms**: Irrelevant content retrieved, high noise
**Fix**: Reduce chunk size, add reranking

### 2. Chunks Too Small
**Symptoms**: Missing context, same doc retrieved multiple times
**Fix**: Increase chunk size, add parent document retrieval

### 3. No Overlap
**Symptoms**: Information at boundaries is lost
**Fix**: Add 10-20% overlap

### 4. Ignoring Document Structure
**Symptoms**: Chunks split tables, code blocks, lists
**Fix**: Use structure-aware chunking

### 5. Same Strategy for All Content
**Symptoms**: Some content types perform worse
**Fix**: Content-specific chunking strategies

### 6. Not Preserving Metadata
**Symptoms**: Can't cite sources, no filtering possible
**Fix**: Always store source, page, section metadata

## Overlap Calculation

```python
def calculate_overlap(chunk_size: int, content_type: str) -> int:
    """
    Calculate recommended overlap based on chunk size and content.
    """
    overlap_ratios = {
        "technical": 0.15,  # 15% - preserve code context
        "legal": 0.20,      # 20% - preserve clause boundaries
        "narrative": 0.10,  # 10% - prose flows naturally
        "tabular": 0.0,     # 0% - tables are atomic
        "default": 0.12     # 12% - balanced
    }

    ratio = overlap_ratios.get(content_type, overlap_ratios["default"])
    return int(chunk_size * ratio)
```

## Reference Resources

For detailed chunking guidance:
- Chunking strategies overview: https://app.ailog.fr/en/blog/guides/chunking-strategies
- Semantic chunking: https://app.ailog.fr/en/blog/guides/semantic-chunking
- Hierarchical chunking: https://app.ailog.fr/en/blog/guides/hierarchical-chunking
- Fixed-size chunking: https://app.ailog.fr/en/blog/guides/fixed-size-chunking
- Parent document retrieval: https://app.ailog.fr/en/blog/guides/parent-document-retrieval

## Quick Reference Card

| Document Type | Strategy | Size | Overlap | Key Consideration |
|---------------|----------|------|---------|-------------------|
| Code | By function/class | 500-1000 | 50-100 | Preserve syntax |
| Legal | Hierarchical | 300-500 | 100-150 | Clause boundaries |
| FAQ | Q&A pairs | Variable | 0 | Complete pairs |
| Articles | Semantic | 800-1200 | 100-200 | Paragraph integrity |
| Tables | Row-based | 10-50 rows | 0 + headers | Include headers |
| Manuals | Section-based | 600-1000 | 100 | Step integrity |
| Chat logs | By conversation | Variable | 0 | Timestamp groups |
