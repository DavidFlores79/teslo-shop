import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ProductImage } from ".";

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text', { unique: true })
    title: string;

    @Column('float', { default: 0 })
    price: number;

    @Column('text', { nullable: true })
    description: string;

    @Column('text', { unique: true })
    slug: string;

    @Column('int', { default: 0 })
    stock: number;

    @OneToMany(() => ProductImage, (productImage) => productImage.product, {
        cascade: true,
        eager: true, // Automatically load images when loading the product
        onDelete: 'CASCADE', // If the product is deleted, delete its images
    })
    images?: ProductImage[];

    @Column('text', { array: true, default: [] })
    sizes: string[];

    @Column('text', { default: 'unisex' })
    gender: string;

    @Column('text', { array: true, default: [] })
    tags: string[];

    @Column('boolean', { default: true })
    isActive: boolean;

    @Column('boolean', { default: false })
    isDeleted: boolean;

    @BeforeInsert()
    checkSlug() {
        if (!this.slug) {
            this.slug = this.title.toLowerCase()
                .replaceAll(' ', '_')
                .replaceAll("'", '');
        } else {
            this.slug = this.slug.toLowerCase()
                .replaceAll(' ', '_')
                .replaceAll("'", '');
        }
    }

    @BeforeUpdate()
    checkSlugOnUpdate() {
        this.slug = this.title.toLowerCase()
            .replaceAll(' ', '_')
            //remover acentos y caracteres especiales
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replaceAll("'", '');
    }
}
