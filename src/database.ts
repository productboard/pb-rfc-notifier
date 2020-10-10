type Database = {
  has: (id: string) => boolean;
  add: (id: string) => Database;
};

export const initDatabase = (data: Array<string>): Database => {
  const persister = new Set(data);

  return {
    has: persister.has.bind(persister),
    add: persister.add.bind(persister),
  };
};
