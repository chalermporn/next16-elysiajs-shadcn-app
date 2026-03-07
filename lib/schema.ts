import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  date,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  role: userRoleEnum('role').notNull().default('user'),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const todos = pgTable(
  'todos',
  {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    completed: boolean('completed').notNull().default(false),
    dueDate: date('due_date'),
    category: varchar('category', { length: 100 }),
    priority: integer('priority'),
    storyPoints: integer('story_points'),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('todos_user_id_idx').on(table.userId),
    index('todos_completed_idx').on(table.completed),
    index('todos_category_idx').on(table.category),
    index('todos_workspace_id_idx').on(table.workspaceId),
  ]
);

export const usersRelations = relations(users, ({ many }) => ({
  todos: many(todos),
}));

export const todosRelations = relations(todos, ({ one }) => ({
  user: one(users),
  workspace: one(workspaces),
}));

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  todos: many(todos),
}));
