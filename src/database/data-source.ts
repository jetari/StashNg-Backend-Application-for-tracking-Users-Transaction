import { DataSource } from "typeorm";
import { User } from "../entity/user";
import { Transaction } from "../entity/transaction";
import dotenv from "dotenv";
dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DB_CONNECTION_URL,
  synchronize: true,
  logging: false,
  entities: [User, Transaction],
  subscribers: [],
  migrations: [],
  extra: {
    timezone: "local",
  },
});
