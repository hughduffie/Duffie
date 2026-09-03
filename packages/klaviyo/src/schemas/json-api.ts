import { z } from 'zod';

/**
 * Shared JSON:API envelope pieces.
 *
 * Every schema is deliberately permissive about fields we do not consume
 * (`.passthrough()` on resource attributes) so a Klaviyo additive change never
 * fails an audit, while still being strict about the fields we rely on.
 */

export const linksSchema = z
  .object({
    self: z.string().nullish(),
    first: z.string().nullish(),
    last: z.string().nullish(),
    prev: z.string().nullish(),
    next: z.string().nullish(),
  })
  .partial()
  .passthrough();

export const relationshipRefSchema = z.object({
  type: z.string(),
  id: z.string(),
});

export const relationshipSchema = z
  .object({
    data: z.union([relationshipRefSchema, z.array(relationshipRefSchema), z.null()]).optional(),
    links: linksSchema.optional(),
  })
  .passthrough();

/** A single resource object: `{ type, id, attributes, relationships }`. */
export function resourceSchema<A extends z.ZodTypeAny>(type: string, attributes: A) {
  return z
    .object({
      type: z.literal(type),
      id: z.string(),
      attributes,
      relationships: z.record(relationshipSchema).optional(),
      links: linksSchema.optional(),
    })
    .passthrough();
}

/** `{ data: Resource, included?: [...] }` */
export function documentSchema<R extends z.ZodTypeAny>(resource: R) {
  return z
    .object({
      data: resource,
      included: z.array(z.unknown()).optional(),
      links: linksSchema.optional(),
    })
    .passthrough();
}

/** `{ data: Resource[], links: { next }, included?: [...] }` */
export function collectionSchema<R extends z.ZodTypeAny>(resource: R) {
  return z
    .object({
      data: z.array(resource),
      included: z.array(z.unknown()).optional(),
      links: linksSchema.optional(),
    })
    .passthrough();
}

/**
 * Builds a Klaviyo filter expression.
 * Klaviyo's filter grammar is `operator(field,value)` combined with `and(...)`.
 */
export const filter = {
  equals: (field: string, value: string | number | boolean): string =>
    `equals(${field},${literal(value)})`,
  any: (field: string, values: readonly (string | number)[]): string =>
    `any(${field},[${values.map(literal).join(',')}])`,
  contains: (field: string, value: string): string => `contains(${field},${literal(value)})`,
  greaterOrEqual: (field: string, value: string | Date): string =>
    `greater-or-equal(${field},${literal(toIso(value))})`,
  lessOrEqual: (field: string, value: string | Date): string =>
    `less-or-equal(${field},${literal(toIso(value))})`,
  lessThan: (field: string, value: string | Date): string =>
    `less-than(${field},${literal(toIso(value))})`,
  and: (...clauses: (string | undefined)[]): string => {
    const present = clauses.filter((c): c is string => Boolean(c));
    if (present.length === 0) throw new Error('filter.and requires at least one clause');
    return present.length === 1 ? present[0]! : `and(${present.join(',')})`;
  },
};

function toIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

function literal(value: string | number | boolean): string {
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  // Klaviyo accepts double-quoted strings; escape embedded quotes/backslashes.
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}
