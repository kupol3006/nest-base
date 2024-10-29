import { IsEmpty } from 'class-validator';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column()
    password: string;

    @Column({ default: "" })
    phone: string;

    @Column({ default: "" })
    address: string;

    @Column({ default: "" })
    image: string;

    @Column({ default: "USERS" })
    role: string;

    @Column({ default: "LOCAL" })
    accountType: string;

    @Column({ default: false })
    isActive: boolean;

    @Column({ default: "" })
    codeId: string;


    @IsEmpty()
    @Column({ type: 'timestamp', nullable: true })
    codeExpired: Date | null;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}