import {Column, PrimaryGeneratedColumn, Entity, BeforeInsert, BeforeUpdate} from 'typeorm';
import { validateOrReject, IsDefined } from 'class-validator';

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    @IsDefined()
    uuid!: string;

    @Column()
    @IsDefined()
    firstName!: string;

    @Column()
    @IsDefined()
    lastName!: string;

    @Column({unique: true})
    @IsDefined()
    email!: string;

    @Column()
    @IsDefined()
    password!: string;

    @Column({nullable: true})
    role?: number;

    @Column({nullable: true})
    discordId?: string;

    @Column({nullable: true})
    githubId?: string;

    @BeforeInsert()
    @BeforeUpdate()
    async validate(): Promise<void> {
        await validateOrReject(this);
    }
}