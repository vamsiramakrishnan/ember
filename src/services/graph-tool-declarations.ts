/**
 * GraphToolDeclarations — Gemini function declaration objects for
 * the persistent knowledge graph tools.
 *
 * These declarations define the schema that the AI model uses to
 * invoke graph exploration and mutation tools during a tutoring session.
 */
export const GRAPH_TOOL_DECLARATIONS = [
  {
    functionDeclarations: [
      {
        name: 'traverse_graph',
        description: 'Explore the knowledge graph outward from an entity. Returns all connected entities within N hops, filtered by relation types. Use to discover what concepts/thinkers/terms connect to a given idea.',
        parameters: {
          type: 'object',
          properties: {
            entity_id: { type: 'string', description: 'Starting entity ID.' },
            depth: { type: 'number', description: 'How many hops (1-3). Default 2.' },
            relation_types: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by relation types: explores, references, introduces, bridges-to, cross-references, defines. Empty = all.',
            },
          },
          required: ['entity_id'],
        },
      },
      {
        name: 'find_path',
        description: 'Find the shortest connection path between two entities in the knowledge graph. Reveals hidden bridges — how a thinker connects to a concept through the student\'s own exploration history.',
        parameters: {
          type: 'object',
          properties: {
            from_id: { type: 'string', description: 'Source entity ID.' },
            to_id: { type: 'string', description: 'Target entity ID.' },
          },
          required: ['from_id', 'to_id'],
        },
      },
      {
        name: 'discover_gaps',
        description: 'Find learning gaps — concepts the student has encountered but not developed, thinkers met but not explored, questions asked but not resolved. Returns prioritized suggestions.',
        parameters: {
          type: 'object',
          properties: {
            focus: {
              type: 'string',
              enum: ['mastery', 'thinkers', 'curiosities', 'all'],
              description: 'What kind of gaps to look for. Default "all".',
            },
          },
        },
      },
      {
        name: 'get_concept_journey',
        description: 'Trace how the student\'s understanding of a concept evolved over time. Returns a timeline of entries, mastery changes, and related discoveries.',
        parameters: {
          type: 'object',
          properties: {
            concept: { type: 'string', description: 'The concept name.' },
          },
          required: ['concept'],
        },
      },
      {
        name: 'read_attachment',
        description: 'Read and summarize an uploaded file, image, or PDF that the student has attached. Returns the content or a description.',
        parameters: {
          type: 'object',
          properties: {
            entry_id: { type: 'string', description: 'The entry ID that contains the attachment.' },
          },
          required: ['entry_id'],
        },
      },
      {
        name: 'suggest_bridge',
        description: 'Find surprising connections between concepts across different notebooks. Reveals that music theory connects to evolution, or that Kepler\'s harmonics bridges to linguistics.',
        parameters: {
          type: 'object',
          properties: {
            concept: { type: 'string', description: 'Starting concept to find bridges from.' },
          },
          required: ['concept'],
        },
      },
      {
        name: 'link_entities',
        description: 'Create a new connection in the knowledge graph. Use when you notice a relationship the student hasn\'t made explicit yet.',
        parameters: {
          type: 'object',
          properties: {
            from_id: { type: 'string', description: 'Source entity.' },
            to_id: { type: 'string', description: 'Target entity.' },
            relation_type: {
              type: 'string',
              enum: ['references', 'bridges-to', 'cross-references', 'explores'],
              description: 'Type of relationship.',
            },
            reason: { type: 'string', description: 'Why this connection exists (shown to student on hover).' },
          },
          required: ['from_id', 'to_id', 'relation_type'],
        },
      },
      {
        name: 'get_entity_neighborhood',
        description: 'Get everything directly connected to an entity — all incoming and outgoing relations with their types. Like looking at one node in the constellation and seeing every thread that connects to it.',
        parameters: {
          type: 'object',
          properties: {
            entity_id: { type: 'string', description: 'The entity to inspect.' },
          },
          required: ['entity_id'],
        },
      },
      {
        name: 'compose_visual',
        description: 'Compose a rich concept diagram from real knowledge graph data. Pulls mastery levels, thinker encounters, and graph relationships to build enriched diagram nodes. Also classifies the best layout (flow, tree, radial, pyramid, cycle, timeline, constellation) and checks for an existing diagram to update instead of creating a new one. ALWAYS call this instead of generating raw concept-diagram JSON — it grounds the diagram in the student\'s actual knowledge state.',
        parameters: {
          type: 'object',
          properties: {
            topic: { type: 'string', description: 'The topic or question the diagram should visualize.' },
            concepts: {
              type: 'array',
              items: { type: 'string' },
              description: 'Specific concept names to include in the diagram.',
            },
            intent: {
              type: 'string',
              enum: ['hierarchy', 'process', 'comparison', 'evolution', 'web', 'cycle', 'layers'],
              description: 'The structural relationship to visualize. hierarchy=tree, process=flow, comparison=radial, evolution=timeline, web=constellation, cycle=circular loop, layers=pyramid.',
            },
            session_id: { type: 'string', description: 'Current session ID — used to find existing diagrams for delta updates.' },
          },
          required: ['topic'],
        },
      },
      {
        name: 'merge_visual_delta',
        description: 'Update an existing concept diagram instead of creating a new one. Adds new nodes, new edges, and updates mastery data on existing nodes. The student sees their diagram grow organically as they explore.',
        parameters: {
          type: 'object',
          properties: {
            entry_id: { type: 'string', description: 'The ID of the existing concept-diagram entry to update.' },
            add_nodes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  subLabel: { type: 'string' },
                  accent: { type: 'string', enum: ['sage', 'indigo', 'amber', 'margin'] },
                  detail: { type: 'string' },
                  entityKind: { type: 'string', enum: ['concept', 'thinker', 'term'] },
                },
                required: ['label'],
              },
              description: 'New nodes to add to the diagram.',
            },
            add_edges: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  from: { type: 'number', description: 'Index of source node (existing or newly added).' },
                  to: { type: 'number', description: 'Index of target node (existing or newly added).' },
                  label: { type: 'string' },
                  type: { type: 'string', enum: ['causes', 'enables', 'contrasts', 'extends', 'requires', 'bridges'] },
                },
                required: ['from', 'to'],
              },
              description: 'New edges to add.',
            },
            update_nodes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  index: { type: 'number', description: 'Index of the node to update.' },
                  mastery: {
                    type: 'object',
                    properties: {
                      level: { type: 'string' },
                      percentage: { type: 'number' },
                    },
                  },
                  detail: { type: 'string' },
                },
                required: ['index'],
              },
              description: 'Updates to apply to existing nodes.',
            },
            new_layout: {
              type: 'string',
              enum: ['flow', 'tree', 'radial', 'pyramid', 'cycle', 'timeline', 'constellation', 'graph'],
              description: 'Change the layout. Omit to keep existing.',
            },
          },
          required: ['entry_id'],
        },
      },
    ],
  },
];
