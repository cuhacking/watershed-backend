import {Column, PrimaryGeneratedColumn, Entity, BeforeInsert, BeforeUpdate} from 'typeorm';
import { validateOrReject, IsDefined } from 'class-validator';

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({nullable: false})
    @IsDefined()
    firstName!: string;

    @Column({nullable: false})
    @IsDefined()
    lastName!: string;

    @Column({nullable: false, unique: true})
    @IsDefined()
    email!: string;

    @Column({nullable: false})
    @IsDefined()
    password!: string;

    @Column({nullable: true})
    role!: number;

    @BeforeInsert()
    @BeforeUpdate()
    async validate(): Promise<void> {
        await validateOrReject(this);
    }
}