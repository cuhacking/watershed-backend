import {Column, PrimaryGeneratedColumn, Entity, BeforeInsert, BeforeUpdate, ManyToMany, JoinTable } from 'typeorm';
import { validateOrReject, IsDefined } from 'class-validator';
import {Resource} from '../entity/Resource';

@Entity()
export class Event {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    @IsDefined()
    title!: string;

    @Column()
    @IsDefined()
    type!: string;

    @Column({type: 'timestamp'})
    @IsDefined()
    startTime!: Date;

    @Column({nullable: true, type: 'timestamp'})
    endTime?: Date;

    @Column()
    @IsDefined()
    location!: string;

    @Column()
    @IsDefined()
    locationName!: string;

    @Column()
    @IsDefined()
    host!: string;

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