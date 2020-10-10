export type Await<T> = T extends PromiseLike<infer U> ? U : T;
export type Values<T> = T extends { [key: string]: infer U } ? U : T;
