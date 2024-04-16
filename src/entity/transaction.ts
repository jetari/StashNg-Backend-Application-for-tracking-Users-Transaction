import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user";

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "numeric" })
  amount!: number;

  @Column()
  description!: string;

  @Column({ type: "enum", enum: ["income", "expense"] })
  type!: "income" | "expense";

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  date!: Date;

  @Column()
  userId!: string;

  @ManyToOne(() => User, (user) => user.transactions)
  @JoinColumn({ name: "userId" })
  user!: User;
}
