import {Column, PrimaryGeneratedColumn, Entity, BeforeInsert, BeforeUpdate, ManyToMany, JoinTable } from 'typeorm';
import { validateOrReject, IsDefined } from 'class-validator';
import {Resource} from '../entity/Resource';

export type EventType = "sponsor" | "key-times" | "workshops" | "activities" | "social-events";
@Entity()
export class Event {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    @IsDefined()
    title!: string;

    @Column()
    @IsDefined()
    type!: EventType;

    @Column({type: 'timestamp'})
    @IsDefined()
    startTime!: Date;

    @Column({nullable: true, type: 'timestamp'})
    endTime?: Date;

    @Column({nullable: true, type: 'varchar'})
    location?: string;

    @Column({nullable: true, type: 'varchar'})
    locationName?: string;

    @Column({nullable: true, type: 'varchar'})
    host?: string;

    @Column()
    @IsDefined()
    description!: string;

    @ManyToMany(() => Resource, {cascade: true})
    @JoinTable()
    resources!: Resource[];

    @BeforeInsert()
    @BeforeUpdate()
    async validate(): Promise<void> {
        await validateOrReject(this);
    }
}