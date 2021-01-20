import {Column, PrimaryGeneratedColumn, Entity, BeforeInsert, BeforeUpdate} from 'typeorm';
import { validateOrReject, IsDefined } from 'class-validator';

@Entity()
export class Resource {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    @IsDefined()
    title!: string;

    @Column()
    @IsDefined()
    link!: string;

    @BeforeInsert()
    @BeforeUpdate()
    async validate(): Promise<void> {
        await validateOrReject(this);
    }
}