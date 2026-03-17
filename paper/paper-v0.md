# Sphoṭa Architecture: A Zero-Data, Rule-Based Morpheme Tokenizer for Sanskrit Language Models

**Naga Dheeraj Santosh Kumar Kollipara**
*Independent Researcher*
*nagadheeraj.kollipara@gmail.com*

---

## Abstract

Current large language models tokenize text using statistical subword algorithms (BPE, SentencePiece) that learn boundary rules from corpus frequency rather than linguistic structure. For Sanskrit — a morphologically rich language with a formally complete grammar — this produces systematic inefficiency: recent work documents approximately 2× fewer tokens under morpheme-aware tokenization compared to production tokenizers (Kumar, 2026). We propose the Sphoṭa Architecture: the first integration of Pāṇini's Ashtadhyayi as an ML preprocessing pipeline — a deterministic, rule-based morpheme tokenizer requiring zero training data, provably complete for classical Sanskrit morphology, and producing unambiguous morpheme boundaries. We propose to benchmark against BPE and SentencePiece on the Digital Corpus of Sanskrit using morpheme boundary F1-score and vocabulary fertility. This work directly answers two recent open calls: Srikant et al. (IntelliSys 2025) benchmark existing LLMs on Sanskrit and call for a Pāṇini-based model without building one; Kumar (2026) documents the tokenization gap and calls for a grammar-aware tokenizer without providing one. We provide it. We additionally record Binary Matrix Glyphs — a proposed machine-native 2D morpheme encoding designed for transformer attention geometry — as a contemporaneous research direction to be developed separately.

---

## 1. Introduction

Modern large language model tokenizers are statistical approximations. BPE (Sennrich et al., 2016) and SentencePiece (Kudo & Richardson, 2018) learn subword merge rules from corpus frequency. This produces three compounding problems:

**Token inefficiency.** Morphologically rich languages are penalized under frequency-based tokenization. Sanskrit, with its agglutinative morphology and sandhi-based fusion, is split into fragments that do not correspond to meaningful units. A documented consequence: ~2× token overhead vs. morpheme-aware tokenization, and up to 20× overhead when Sanskrit commentary is compared to its English equivalent (Kumar, 2026).

**Boundary ambiguity.** Statistical tokenizers produce different splits for the same morpheme depending on context and training data distribution. Morpheme boundaries become probabilistic rather than linguistically grounded.

**Training data dependency.** A BPE tokenizer trained on Sanskrit requires a Sanskrit corpus. Sanskrit corpora are small (~4.8M morphologically annotated words in the Digital Corpus of Sanskrit, vs. hundreds of billions of tokens in English pretraining). Statistical tokenizers perform poorly on low-resource languages precisely where linguistically informed tokenizers would be most useful.

We propose a different approach: derive the morpheme vocabulary not from corpus statistics but from Pāṇini's Ashtadhyayi — a formal generative grammar of Sanskrit that produces every valid morphological form deterministically from ~2,000 verbal roots. The vocabulary is compiled, not learned. It is complete, not approximate. It requires zero training data.

This paper describes the architecture, presents a proposed benchmarking experiment, and introduces Binary Matrix Glyphs as a timestamped future research direction.

---

## 2. Related Work

### 2.1 Statistical Morpheme Tokenizers

Morfessor (Virpioja et al., 2013) is the baseline for unsupervised morpheme segmentation — it learns morpheme boundaries from corpus statistics without linguistic rules. MorphPiece (Jabbar, 2023) demonstrates that linguistically motivated tokenization produces GPT-quality language models at approximately half the training iterations of BPE-GPT2. MorphBPE (Asgari et al., 2025) extends BPE with morphological awareness and consistently reduces cross-entropy loss at 300M and 1B parameter scales across English, Russian, Hungarian, and Arabic.

These works validate the direction: morpheme-aligned tokenization outperforms frequency-based tokenization. The key distinction of our proposal is that MorphPiece and MorphBPE remain learned or hybrid approaches — they still require training data to discover morpheme boundaries. Our tokenizer derives boundaries from formal grammar rules. The result is formally complete and requires zero training data.

### 2.2 Sanskrit NLP

TransLIST (Sandhan et al., EMNLP 2022) is a transformer-based Sanskrit word segmenter using linguistic information — sandhi rules and the Heritage Platform — achieving 7.2 points above state-of-the-art on perfect match metrics. TransLIST solves Sanskrit word segmentation as an NLP task; our work uses the Pāṇinian morpheme space as a pretraining tokenizer vocabulary. These are different application domains.

SanskritShala (Sandhan et al., ACL 2023) provides state-of-the-art neural tools for word segmentation, morphological tagging, and dependency parsing, including seven word embedding models trained on Sanskrit corpora.

ByT5-Sanskrit (EMNLP 2024) takes the opposite approach: byte-level encoding bypasses tokenization entirely. Where ByT5 argues for no tokens, we argue for richer, rule-derived tokens. These are competing philosophies, both valid.

The Sanskrit Heritage Platform (Huet, 2008) is the most rigorous existing computational implementation of Pāṇini's grammar — built in OCaml, implementing full morphological analysis and sandhi splitting. Unlike Heritage Platform's on-demand morphological analysis, this work pre-compiles the vocabulary as a closed set for LLM tokenization, trading runtime flexibility for deterministic preprocessing. Our proposal builds on Huet's work as its computational foundation; the novelty is the ML pipeline application, not the analyzer itself.

### 2.3 The Open Calls We Answer

Two papers explicitly identify the gap this work fills:

Srikant et al. (IntelliSys 2025) benchmark existing LLMs on Sanskrit tasks, demonstrate their inadequacy, and argue for a Pāṇini sutra-based model. They do not build one.

Kumar (2026) quantitatively documents Sanskrit's token efficiency advantage and explicitly calls for "a grammar and morphology-aware tokenizer leveraging Pāṇini's Sandhi and Vibhakti rules." The paper does not provide this tokenizer.

We provide the concrete architecture.

---

## 3. Sanskrit as a Generative Rule System

The framing this work depends on: **Sanskrit is not a natural language in the relevant sense. It is a formal generative system that humans happen to be able to speak.**

Pāṇini's Ashtadhyayi (circa 4th century BCE) contains 3,959 rules that, given any verbal root (dhātu) from the Dhātupātha (~2,000 entries), deterministically generate every valid morphological form — inflected verbs, declined nouns, compound words — with zero ambiguity. Kiparsky (2009) demonstrates that this grammar is formally more powerful than context-free grammar — "contextualized replacement systems" closer to Turing-equivalent in generative capacity. Huet's (2008) computational implementation at INRIA confirms the rules are machine-executable today.

**The generative vs. accumulative distinction.** Natural languages like English accumulate vocabulary through borrowing — "typhoon" from Chinese táifēng, "algebra" from Arabic al-jabr. Each borrowed word carries its history of cultural associations, embedded in the statistical co-occurrences of its training corpus. Sanskrit generates vocabulary from roots and suffixes according to formal rules — "anukūla" (suitable) = ana (along) + kūla (bank/shore). The meaning of every morpheme is derivable from its grammatical components, not from its historical usage pattern.

For a tokenizer, this means: the morpheme vocabulary does not need to be discovered from data. It is *computed* from rules. The tokenizer is not trained. It is *compiled*.

**A note on prior misrepresentation.** Briggs (1985) observed structural parallels between Sanskrit's kāraka relations and 1985-era symbolic AI knowledge representation systems. This is a historical observation, not a rigorous proof of computational equivalence, and has been frequently misrepresented in popular media. The formal computational claims in this paper rest on Kiparsky (2009) and Huet (2008), not on Briggs.

---

## 4. The Pāṇinian Tokenizer

### 4.1 Architecture

Standard tokenizers (BPE, WordPiece, SentencePiece) learn merge rules from corpus statistics. They are incomplete (missing valid morphemes absent from training data), ambiguous (same string tokenizes differently by context), and biased (high-frequency training patterns dominate boundary decisions).

A Pāṇini-compiled tokenizer operates differently:

1. The Dhātupātha provides ~2,000 root meanings as a finite lexicon
2. Ashtadhyayi rules generate all valid suffixed, prefixed, and compounded forms — estimated at 50,000–200,000 unique morphemes depending on compound depth
3. Sandhi rules deterministically resolve morpheme boundary transformations at junctions
4. The result is a complete, closed, unambiguous morpheme vocabulary — built once, never retrained

This is the logical endpoint of the trajectory established by MorphPiece and MorphBPE: if morpheme-aware tokenization consistently outperforms frequency-based tokenization, the formally complete, zero-data case is where that trajectory terminates.

### 4.2 Limitations — Sandhi Accuracy

Pāṇinian tokenization requires sandhi splitting as a prerequisite: words fused at morpheme boundaries must be correctly split before morpheme analysis. Current benchmarks (Bhardwaj et al., SandhiKosh, LREC 2018) show best-performing tools achieve approximately 70–82% accuracy across sandhi splitting and merging tasks, with the INRIA tool reaching ~82% on merging and ~71% on splitting on the largest corpus tested. Approximately 1 in 5 compound splits contains an error.

This is a real limitation and is acknowledged as such. It is an engineering challenge — recent neural tools (ByT5-Sanskrit, TransLIST) improve on these baselines — not a fundamental flaw in the Pāṇinian vocabulary proposal. The tokenizer vocabulary is formally complete; the pre-processing step that feeds it is probabilistic. We bound the claim accordingly: **morpheme vocabulary construction is zero-training-data and formally complete; sandhi pre-processing relies on probabilistic splitting tools with documented accuracy.**

### 4.3 Why Sanskrit and Not Turkish or Finnish?

Morphologically rich languages exist beyond Sanskrit — Turkish, Finnish, Hungarian, Arabic all have agglutinative or inflectional morphology. The question is legitimate.

The answer is not that Sanskrit is morphologically superior. It is that Pāṇini's grammar is uniquely positioned computationally:

1. **Formal completeness**: Pāṇini's grammar is documented as formally complete for classical Sanskrit morphology (Kiparsky 2009, Huet 2008). No other living or classical language has an equivalent — a human-authored grammar implemented as a provably complete computational system.

2. **Zero statistical learning required**: The grammar is rules, not data. Morfessor-style learning from corpus statistics is still required for Turkish, Finnish, and Arabic. For Sanskrit, the vocabulary can be compiled from the grammar.

3. **Existing implementation**: The Heritage Platform (Huet, INRIA) and SanskritNLP (Python) provide working infrastructure. The bottleneck for other morphologically rich languages is not the idea — it is the absence of an equivalent formal grammar implemented computationally.

The framework is potentially generalizable. The first application is Sanskrit because the tools exist.

### 4.4 Counterarguments

**"Existing Sanskrit morphological analyzers already exist (Heritage Platform, SanskritShala). This is redundant."**

Those analyzers are built for NLP parsing tasks — they analyze an input sentence at runtime, returning morphological tags and dependency structure. This work compiles a closed, pre-tokenization morpheme vocabulary from the same grammar, for a different purpose: LLM preprocessing. The Heritage Platform parses input on demand; we use its grammar as a vocabulary source once, then tokenize deterministically against that vocabulary. Different application domain. Not redundant.

**"The sandhi accuracy makes this tokenizer unusable in practice."**

Modern neural tools — TransLIST achieves near-99% on word segmentation, ByT5-Sanskrit operates at the byte level — substantially improve on older baselines. The paper bounds the claim explicitly: morpheme vocabulary construction is formally complete; the sandhi pre-processing step that feeds it is probabilistic, with documented and improving accuracy. This is an engineering constraint, not a flaw in the vocabulary design.

**"This only works for classical Sanskrit. Modern Sanskrit and oral traditions are excluded."**

Correct. Scope is explicitly classical Sanskrit, to which Pāṇini's Ashtadhyayi applies. Modern spoken Sanskrit, regional variations, and Vedic Sanskrit (which predates the Ashtadhyayi) are out of scope. This is a feature of formal scoping, not a limitation of the approach.

**"A vocabulary of 50,000–200,000 morphemes is far larger than standard BPE vocabularies of 10k–50k."**

Fewer tokens per word (estimated 1.1–1.3 vs. 1.8–1.9 for BPE) means shorter sequences, reducing attention cost per forward pass. Whether this offsets the larger embedding table is an empirical question. Experiment 1 measures token count per sentence; Experiment 2 (small LM training) would validate the trade-off at model scale. This is a design trade-off that warrants testing, not a disqualifying flaw.

**"'Provably complete' is too strong. Real Sanskrit has exceptions and historical usage outside Pāṇini's scope."**

The claim is bounded to classical Sanskrit morphology as defined by Pāṇini's Ashtadhyayi and Dhātupātha. Vedic forms, Prakrits, and post-classical borrowings are outside this scope. "Provably complete" means: for any valid morphological form constructible from the Ashtadhyayi rules, the tokenizer vocabulary contains it. Any remaining irregular forms fall back to character-level or UNK handling — the same behavior as BPE on out-of-vocabulary items.

---

*Timestamp (2026-03-09): This work additionally conceives of Binary Matrix Glyphs (BMGs) — a machine-native 2D spatial encoding where each morpheme is assigned a unique N×N binary matrix with grammatical role encoded in spatial cell position, designed for transformer attention geometry rather than human visual reading. Recorded here as originating contemporaneously with this proposal. Developed separately as future work.*

---

## 5. Proposed Experiments

In order of feasibility and priority:

**Experiment 1 — Tokenizer benchmark** *(weeks, no GPU required)*
Tokenize the Digital Corpus of Sanskrit (4.8M words) with (a) BPE, (b) SentencePiece, (c) Pāṇini tokenizer via SanskritNLP. Measure: morpheme boundary F1-score, vocabulary fertility (tokens per word), token count per sentence. This is the minimum experiment that makes this paper empirical rather than a proposal.

**Experiment 2 — Small LM training** *(months, GPU required)*
Train a small language model (1M–7M parameters) on Sanskrit-tokenized text. Compare perplexity and morphological accuracy vs. a BPE-tokenized baseline. Validates whether the tokenizer advantage translates to modeling quality.

**Experiment 3 — Bias benchmarking** *(months, GPU required)*
Run standard bias benchmarks (WEAT, StereoSet) on models trained with Sanskrit vs. English substrate. Tests the hypothesis that formally generative training substrate affects bias profile.

---

## 6. Implications

If the Pāṇinian tokenizer produces measurably better morpheme boundaries, three downstream consequences follow:

**Reduced hallucination for Sanskrit.** Outputs constrained by formal grammar rather than statistical plausibility are less likely to produce grammatically invalid Sanskrit.

**Lower resource requirement.** MorphPiece (Jabbar, 2023) shows morpheme-aligned tokenizers achieve comparable LLM quality at half the training iterations. A formally complete Sanskrit tokenizer may reduce the training data requirement — partially addressing the corpus size problem (4.8M vs. hundreds of billions of tokens).

**A template for other formally documented languages.** Sanskrit is the first case because the tools exist. The framework extends to any language with a formally documented grammar implemented computationally.

---

## 7. Future Directions

**Machine-native encoding.** Binary Matrix Glyphs — a machine-native 2D morpheme encoding where grammatical role is encoded in spatial cell position for transformer attention — are proposed as a separate research direction originating from this work. The central question: does encoding morpheme identity and grammatical role in 2D spatial geometry produce representations more natural for transformer attention than linear positional indices?

**Fractal compositional depth.** A natural extension: each morpheme representation carries meaning at multiple resolutions, with etymological structure at 2×, semantic field at 4×. Relevant prior art: Matryoshka Representation Learning (Kusupati et al., NeurIPS 2022), Hierarchical Transformers (Nawrot et al., ACL 2022).

**Sapir-Whorf for AI.** Does the training substrate shape what internal representations are easy to learn? Training a model on a formally generative substrate rather than a historically accumulated natural language is an extreme test of this hypothesis.

**Sanskrit corpus expansion.** The current Digital Corpus of Sanskrit (~4.8M words) is insufficient for full LLM pretraining. Corpus expansion — including synthetic generation from Ashtadhyayi rules — is a downstream prerequisite.

---

## 8. Conclusion

We propose the Sphoṭa Architecture: the first integration of Pāṇini's Ashtadhyayi as an ML preprocessing pipeline — a zero-training-data, formally complete, rule-based morpheme tokenizer for Sanskrit language models. This work answers an explicit open call from two recent papers (Srikant et al. 2025; Kumar 2026) that document the need without providing the architecture. The tokenizer is buildable today with existing open-source tools. We release this proposal openly to accelerate its realization.

---

## References

- Sennrich, R., Haddow, B., & Birch, A. (2016). Neural Machine Translation of Rare Words with Subword Units. *ACL 2016*.
- Kudo, T., & Richardson, J. (2018). SentencePiece: A simple and language independent subword tokenizer and detokenizer for Neural Text Processing. *EMNLP 2018*.
- Virpioja, S., et al. (2013). Morfessor 2.0: Python Implementation and Extensions for Morfessor Baseline. *Aalto University Publication*.
- Bostrom, K., & Durrett, G. (2020). Byte Pair Encoding is Suboptimal for Language Model Pretraining. *EMNLP 2020 Findings*.
- Jabbar, H. (2023). MorphPiece: A Linguistic Tokenizer for Large Language Models. arXiv:2307.07262.
- Asgari, E., El Kheir, Y., & Sadraei Javaheri, M.A. (2025). MorphBPE: A Morpho-Aware Tokenizer Bridging Linguistic Complexity for Efficient LLM Training Across Morphologies. arXiv:2502.00894.
- Sandhan, J., Singha, A., et al. (2022). TransLIST: A Transformer-Based Linguistically Informed Sanskrit Tokenizer. *EMNLP 2022 Findings*. arXiv:2210.11753.
- Sandhan, J., et al. (2023). SanskritShala: A Neural Sanskrit NLP Toolkit. *ACL 2023 System Demonstrations*. arXiv:2302.09527.
- Bhardwaj, S., Gantayat, N., Chaturvedi, N., Garg, R., & Agarwal, S. (2018). SandhiKosh: A Benchmark Corpus for Evaluating Sanskrit Sandhi Tools. *LREC 2018*.
- Kumar, A. (2026). Is Sanskrit the Most Token-Efficient Language? A Quantitative Study using GPT, Gemini, and SentencePiece. arXiv:2601.06142.
- Srikant, S., Murali, V., Badri, V., Shylaja, S.S., & Rao, M. (2025). Sanskrit LLM: Proving the Need for a Panini Sutra Rule-Based AI Model by Benchmarking the Capabilities of Existing LLMs. *IntelliSys 2025*. Lecture Notes in Networks and Systems, vol 1554, pp. 663–683. https://doi.org/10.1007/978-3-031-99965-9_41
- Kiparsky, P. (2009). On the Architecture of Pāṇini's Grammar. *Springer*. https://link.springer.com/chapter/10.1007/978-3-642-00155-0_2
- Huet, G. (2008). Formal Structure of Sanskrit Text: Requirements Analysis for a Mechanical Sanskrit Processor. *Proceedings of the 2nd International Symposium on Sanskrit Computational Linguistics*, Brown University.
- Dosovitskiy, A., et al. (2021). An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale. *ICLR 2021*.
- Kusupati, A., et al. (2022). Matryoshka Representation Learning. *NeurIPS 2022*.
- Nawrot, P., et al. (2022). Hierarchical Transformers Are More Efficient Language Models. *ACL 2022*.
- Briggs, R. (1985). Knowledge Representation in Sanskrit and Artificial Intelligence. *AI Magazine*. [Historical context only]
