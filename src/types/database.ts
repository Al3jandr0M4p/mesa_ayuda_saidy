export type UserRole = "admin" | "empleado";

export type TicketPriority = "baja" | "media" | "alta";

export type TicketStatus = "abierto" | "en_progreso" | "cerrado";

export type EventPlatform = "google_meet" | "microsoft_teams" | "zoom" | "presencial" | "otro";

export type UserProfile = {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  created_at: string;
  updated_at: string;
};

export type Role = {
  id: UserRole;
  nombre: string;
};

export type Ticket = {
  id: string;
  titulo: string;
  descripcion: string;
  prioridad: TicketPriority;
  estado: TicketStatus;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: string;
  ticket_id: string;
  user_id: string;
  mensaje: string;
  created_at: string;
};

export type TicketWithUser = Ticket & {
  usuarios?: Pick<UserProfile, "nombre" | "email" | "rol"> | null;
};

export type CommentWithUser = Comment & {
  usuarios?: Pick<UserProfile, "nombre" | "email"> | null;
};

export type Event = {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  plataforma: EventPlatform;
  enlace_reunion: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      usuarios: {
        Row: UserProfile;
        Insert: Omit<UserProfile, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<UserProfile, "id" | "created_at" | "updated_at">>;
      };
      roles: {
        Row: Role;
        Insert: Role;
        Update: Partial<Role>;
      };
      tickets: {
        Row: Ticket;
        Insert: Omit<Ticket, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Ticket, "id" | "user_id" | "created_at" | "updated_at">>;
      };
      comentarios: {
        Row: Comment;
        Insert: Omit<Comment, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Pick<Comment, "mensaje">>;
      };
      eventos: {
        Row: Event;
        Insert: Omit<Event, "id" | "created_at" | "plataforma" | "enlace_reunion"> & {
          id?: string;
          plataforma?: EventPlatform;
          enlace_reunion?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<Event, "id" | "created_at">>;
      };
    };
  };
};
