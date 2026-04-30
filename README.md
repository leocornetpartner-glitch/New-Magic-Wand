### New Magic Wand

**New Magic Wand** is a smart extension designed to transform the support agent experience on **SMA-X**. Powered by generative AI (Gemini) and a RAG (Retrieval-Augmented Generation) architecture, the tool provides real-time analysis, intelligent ticket summaries, and actionable resolution steps based on the internal technical documentation (SAP, FNR).

---

## 🚀 Key Features

- **RAG (Retrieval-Augmented Generation):** Direct connection to a Vertex AI Search Data Store containing the technical knowledge base.
- **Intelligent Summarization:** Automatic generation of concise summaries for complex incidents.
- **Resolution Guidance:** Context-aware suggestions and troubleshooting steps based on the actual ticket data.
- **Enterprise Security (RBAC):** Strict access control and verification based on the user's SMA-X assignment groups.

---

## 🏗️ Technical Architecture

The tool relies on a modern, secure, and serverless architecture:

1. **Frontend:** Chrome extension injected directly into the SMA-X Agent interface.
2. **Backend:** Node.js API deployed on **Google Cloud Run**.
3. **Security:** - Authentication via **Google Identity Services** (ID Token).
   - Custom verification middleware (The "Gatekeeper") that queries SMA-X APIs to validate the user's membership in authorized support groups.
4. **AI & Data:** - **Gemini 1.5 Flash / Pro** for advanced text generation.
   - **Vertex AI Search** for grounding responses in verified business data.

---

## 🛠️ Setup & Installation

### Prerequisites
- A Google Cloud Platform project with Vertex AI enabled.
- API access to the Decathlon SMA-X instance (API Gateway).
- Node.js 18+ for local development.

### Environment Variables (.env)
The backend requires the following configuration:
```env
SMAX_LOCATION=[https://api-eu.decathlon.net/smax/](https://api-eu.decathlon.net/smax/)
X_API_KEY=162d915d-7fd9-4df6-ad91-5d7fd96df672
GOOGLE_CLIENT_ID=fnr-supp-aug-vpc-init
ALLOWED_SMAX_GROUPS=['23251979','29838264','44096320','4019462','15293','15291','41141518']
