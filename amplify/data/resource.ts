import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/**
 * Data model — DynamoDB-backed records reached through the Amplify data API (AppSync).
 *
 * Authorization is per student, enforced by the backend:
 *
 * - Every model grants `allow.owner()`, which records the signed-in Cognito identity on
 *   the record's `owner` field and refuses any read, update or delete that does not match
 *   it. The owner field is added and populated by Amplify; it is never sent by the browser.
 * - `authorizationModes` below sets `userPool` as the only default mode. There is no API
 *   key and no public or guest access anywhere in this schema, so the browser can never
 *   reach records it does not own.
 * - `profile_id` is a grouping key for the student's own records (charts, filters). It is
 *   stamped by the frontend provider from the verified session and is *not* an
 *   authorization mechanism — `owner` is.
 *
 * Field names match the domain model in src/types/models.ts.
 */
const schema = a.schema({
  StudentProfile: a
    .model({
      full_name: a.string().required(),
      university: a.string().required(),
      faculty: a.string(),
      department: a.string(),
      academic_level: a.string(),
      academic_session: a.string(),
      semester: a.string(),
      semester_start: a.date(),
      semester_end: a.date(),
      onboarding_completed: a.boolean(),
    })
    .authorization((allow) => [allow.owner()]),

  Course: a
    .model({
      profile_id: a.string(),
      title: a.string().required(),
      code: a.string().required(),
      description: a.string(),
      academic_session: a.string(),
      semester: a.string(),
      credit_units: a.float(),
      instructor: a.string(),
      timetable: a.string(),
      status: a.enum(['active', 'archived']),
    })
    .authorization((allow) => [allow.owner()]),

  AcademicTask: a
    .model({
      profile_id: a.string(),
      title: a.string().required(),
      description: a.string(),
      course_id: a.string(),
      type: a.enum(['assignment', 'test', 'examination', 'project', 'other']),
      due_date: a.date().required(),
      due_time: a.string(),
      priority: a.enum(['low', 'medium', 'high']),
      status: a.enum(['not_started', 'in_progress', 'completed']),
      estimated_minutes: a.integer(),
      completed_date: a.date(),
    })
    .authorization((allow) => [allow.owner()]),

  AcademicEvent: a
    .model({
      profile_id: a.string(),
      title: a.string().required(),
      description: a.string(),
      course_id: a.string(),
      type: a.enum(['lecture', 'test', 'examination', 'assignment', 'project', 'other']),
      start_date: a.date().required(),
      start_time: a.string(),
      end_date: a.date(),
      end_time: a.string(),
      all_day: a.boolean(),
      location: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  Note: a
    .model({
      profile_id: a.string(),
      title: a.string().required(),
      content: a.string(),
      course_id: a.string(),
      tags: a.string().array(),
    })
    .authorization((allow) => [allow.owner()]),

  StudySession: a
    .model({
      profile_id: a.string(),
      course_id: a.string(),
      session_date: a.date().required(),
      started_at: a.datetime(),
      duration_minutes: a.integer().required(),
      source: a.enum(['timer']),
    })
    .authorization((allow) => [allow.owner()]),

  UserPreferences: a
    .model({
      profile_id: a.string(),
      theme: a.enum(['light', 'dark', 'system']),
      focus_minutes: a.integer(),
      short_break_minutes: a.integer(),
      long_break_minutes: a.integer(),
      long_break_every: a.integer(),
      weekly_study_target_hours: a.float(),
      timer_sound: a.boolean(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    // Cognito only. Adding an API key here would expose student records to anyone.
    defaultAuthorizationMode: 'userPool',
  },
});