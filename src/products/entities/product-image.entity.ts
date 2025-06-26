import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product } from ".";


@Entity('product_images')
export class ProductImage {

    @PrimaryGeneratedColumn()
    id: string;

    @Column('text')
    url: string;

    @ManyToOne(() => Product, (product) => product.images, {
        onDelete: 'CASCADE', // If the product is deleted, delete its images
    })
    product: Product;
}