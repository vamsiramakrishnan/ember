/**
 * Agent Tools — function declarations that Gemini agents can call
 * during generation to explore and modify the knowledge graph.
 *
 * Instead of pre-assembling context, we give the agent a library
 * card. It decides what to look up, what to traverse, what to
 * create. This is the difference between a summary and access.
 *
 * Tools:
 * - search_history: semantic search via File Search
 * - lookup_concept: get mastery data for a concept
 * - lookup_thinker: get encounter history for a thinker
 * - lookup_term: get vocabulary definition
 * - get_connections: k-th order graph traversal
 * - get_recent_changes: delta since last invocation
 * - create_annotation: annotate a student's block
 * - create_link: connect two entities in the graph
 * - add_to_lexicon: add a new term to vocabulary
 */

/** Function declarations for Gemini's function calling. */
export const AGENT_TOOL_DECLARATIONS = [
  {
    functionDeclarations: [
      {
        name: 'search_history',
        description: 'Search the student\'s entire intellectual history (past sessions, vocabulary, thinker encounters, mastery data) using semantic search. Returns relevant passages with citations.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'What to search for — a concept, thinker name, question, or topic.',
            },
            scope: {
              type: 'string',
              enum: ['notebook', 'all', 'sessions', 'lexicon', 'encounters', 'mastery'],
              description: 'Where to search. "notebook" = current notebook. "all" = across all notebooks.',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'lookup_concept',
        description: 'Get the student\'s mastery data for a specific concept. Returns mastery level (exploring/developing/strong/mastered) and percentage.',
        parameters: {
          type: 'object',
          properties: {
            concept: { type: 'string', description: 'The concept name to look up.' },
          },
          required: ['concept'],
        },
      },
      {
        name: 'lookup_thinker',
        description: 'Get the student\'s encounter history with a specific thinker. Returns when they first met, core idea, status (active/dormant/bridged).',
        parameters: {
          type: 'object',
          properties: {
            thinker: { type: 'string', description: 'The thinker\'s name.' },
          },
          required: ['thinker'],
        },
      },
      {
        name: 'lookup_term',
        description: 'Look up a term in the student\'s personal vocabulary. Returns definition, mastery level, etymology, and cross-references.',
        parameters: {
          type: 'object',
          properties: {
            term: { type: 'string', description: 'The vocabulary term to look up.' },
          },
          required: ['term'],
        },
      },
      {
        name: 'get_connections',
        description: 'Traverse the knowledge graph to find connections around a concept. Returns nodes and edges within k hops. Use depth=1 for direct connections, depth=2 for second-order connections.',
        parameters: {
          type: 'object',
          properties: {
            entity: { type: 'string', description: 'The starting entity (concept, thinker, or term name).' },
            depth: { type: 'number', description: 'How many hops to traverse (1 = direct, 2 = friends-of-friends). Default 1.' },
          },
          required: ['entity'],
        },
      },
      {
        name: 'get_recent_changes',
        description: 'Get what changed in the student\'s knowledge graph since the last check. Returns new concepts, updated mastery levels, new vocabulary, new thinker encounters.',
        parameters: {
          type: 'object',
          properties: {
            since_minutes: { type: 'number', description: 'How far back to look, in minutes. Default 30.' },
          },
        },
      },
      {
        name: 'create_annotation',
        description: 'Annotate a specific student block with a margin note. Use this to point out connections, suggest deeper exploration, or note something the student might have missed.',
        parameters: {
          type: 'object',
          properties: {
            entry_id: { type: 'string', description: 'The ID of the entry to annotate.' },
            content: { type: 'string', description: 'The annotation text (1-2 sentences max).' },
          },
          required: ['entry_id', 'content'],
        },
      },
      {
        name: 'get_entry_content',
        description: 'Fetch the full content of a notebook entry by its ID. Use this to drill into entries you see in context summaries (e.g., reading material slides, flashcard decks, exercise sets, code cells, uploaded files). Returns the complete structured data.',
        parameters: {
          type: 'object',
          properties: {
            entry_id: { type: 'string', description: 'The entry ID from the context summary (e.g., "entry-abc123").' },
          },
          required: ['entry_id'],
        },
      },
      {
        name: 'read_file_content',
        description: 'Read the text content of an uploaded file (CSV, JSON, code, plain text). Returns the first 2000 characters. For binary files (images, PDFs), use read_attachment or search_history instead.',
        parameters: {
          type: 'object',
          properties: {
            entry_id: { type: 'string', description: 'The entry ID of the file-upload or code-cell entry.' },
          },
          required: ['entry_id'],
        },
      },
      {
        name: 'add_to_lexicon',
        description: 'Add a new term to the student\'s personal vocabulary. Use when the student uses a term meaningfully for the first time.',
        parameters: {
          type: 'object',
          properties: {
            term: { type: 'string', description: 'The vocabulary term.' },
            definition: { type: 'string', description: 'Student-accessible definition.' },
            etymology: { type: 'string', description: 'Origin and history of the term (optional).' },
          },
          required: ['term', 'definition'],
        },
      },
    ],
  },
];
