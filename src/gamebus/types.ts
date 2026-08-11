export type IframeReadyMessage = {
  type: 'IFRAME_READY';
  data?: { height?: number };
};

export type ActivityPropertyPayload = {
  template: string;
  obj: Record<string, unknown>;
  visibility?: 'public' | 'private' | 'hidden';
};

export type ActivityMessage = {
  type: 'ACTIVITY';
  data: {
    template: string;
    provider?: string | null;
    start: string;
    end: string;
    properties: ActivityPropertyPayload[];
    actors?: string | string[];
    onlyPersistIfContributing?: boolean;
  };
};

export type TaskLinkedProperty = {
  id?: string;
  order?: number;
  name?: string | null;
  required?: boolean;
  ref?: string;
  reference?: string;
};

export type TaskEmbeddedPropertyTemplate = {
  id?: string;
  reference: string;
  name?: string | null;
  schema?: unknown;
};

export type TaskActivityTemplate = {
  id: string;
  reference: string;
  name: string | null;
  providers: { reference: string; origins: unknown }[];
  linkedProperties?: TaskLinkedProperty[];
  properties?: TaskEmbeddedPropertyTemplate[];
};

export type TaskPropertyTemplate = {
  id: string;
  reference: string;
  name: string | null;
  schema: unknown;
  defaultVisibility: string;
};

export type TaskData = {
  id: string;
  href: string | null;
  type: string;
  url: string | null;
  order: number;
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  hero: string | null;
  cycle: unknown;
  isVisible: boolean;
  activityTemplates: TaskActivityTemplate[];
  inputCollections: unknown[];
  propertyTemplates?: TaskPropertyTemplate[];
  taskRules: unknown[];
};

export type TaskMessage = {
  type: 'TASK';
  data: TaskData;
};

/** Raw parent payload — structure preserved until inspected from live GameBus. */
export type GameBusInputCollectionsPayload = Record<string, unknown>;

export type InputCollectionsMessage = {
  type: 'INPUT_COLLECTIONS';
  data?: GameBusInputCollectionsPayload;
};

export type ParentToChildMessage = TaskMessage | InputCollectionsMessage;
