/**
 * Three Minds v2 - Type Definitions
 */

export interface AgentPersona {
  name: string;           // Display name
  emoji: string;          // Identifier emoji
  persona: string;        // Persona description (becomes part of system prompt)
}

export interface CouncilConfig {
  name: string;
  agents: AgentPersona[];
  maxRounds: number;
  projectDir: string;     // Shared working directory
}

export interface AgentResponse {
  agent: string;
  round: number;
  content: string;        // Agent's response
  consensus: boolean;     // Whether voted to finish
  sessionKey: string;     // Child session key
  timestamp: string;
}

export interface CouncilSession {
  id: string;
  task: string;           // Task description
  config: CouncilConfig;
  responses: AgentResponse[];
  status: 'running' | 'consensus' | 'max_rounds' | 'error';
  startTime: string;
  endTime?: string;
  finalSummary?: string;
}

export interface SpawnResult {
  status: string;
  childSessionKey: string;
  runId: string;
}

export interface SessionHistoryMessage {
  role: string;
  content: string;
}
