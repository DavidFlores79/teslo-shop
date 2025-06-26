import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import { DataSource, Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { ProductImage } from '../entities';


@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductService'); // Initialize a logger for the service

  constructor(
    @InjectRepository(Product) // Inject the Product repository
    private readonly productRepository: Repository<Product>, // Use the Product entity
    @InjectRepository(ProductImage) // Inject the ProductImage repository
    private readonly productImageRepository: Repository<ProductImage>, // Use the ProductImage entity
    private readonly dataSource: DataSource, // Inject the DataSource for database operations
  ) { }

  async create(createProductDto: CreateProductDto) {
    try {

      const { images = [], ...productData } = createProductDto; // Destructure images from the DTO, defaulting to an empty array if not provided

      const product = this.productRepository.create(
        {
          ...productData,
          images: images.map(image => this.productImageRepository.create({ url: image })) // Map each image URL to a ProductImage entity
        }
      ); // Create a new product instance
      
      await this.productRepository.save(product); // Save the product to the database
      return { ...product, images }; // Return the created product along with its images

    } catch (error) {
      this.handleError(error); // Handle any errors that occur during the creation process
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const products = await this.productRepository.find({
      take: paginationDto.limit || 10, // Limit the number of results returned
      skip: paginationDto.offset || 0, // Skip a number of results for pagination
      relations: {
        images: true, // Include related images in the results
      },
      where: {
        isActive: true, // Only retrieve active products
      },
    }); // Retrieve all products from the database

    return products.map(product => ({
      ...product, // Spread the product properties
      images: product.images?.map(image => image.url) // Map the images to their URLs
    })); // Return the products with their image URLs
  }

  async findOne(id: string) {

    const product = await this.productRepository.findOne({ where: { id } }); // Find a product by its ID
    if (!product) {
      throw new NotFoundException(`Product with Id: ${id}  not found`); // Throw an exception if the product does not exist
    }

    return product; // Return the found product
  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const { images = [], ...updateData } = updateProductDto; 

    const product = await this.productRepository.preload({
      id, // Preload the product with the given ID
      ...updateData, // Update the product with the new data
    });

    if (!product) {
      throw new NotFoundException(`Product with Id: ${id} not found`); // Throw an exception if the product does not exist
    }

    // Create Query Runner
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect(); // Connect the query runner to the database
    await queryRunner.startTransaction(); // Start a transaction

    try {
      // If images are provided, delete existing images and add new ones
      if (images) {
        // Delete existing images from the database
        await queryRunner.manager.delete(ProductImage, { product: { id } });
        // Map new images to ProductImage entities and save them
        product.images = images.map(image => this.productImageRepository.create({ url: image }));
      }

      await queryRunner.manager.save(product); // Save the updated product with its images
      await queryRunner.commitTransaction(); // Commit the transaction
      return { ...product, images }; // Return the updated product along with its images
    } catch (error) {
      await queryRunner.rollbackTransaction(); // Rollback the transaction in case of an error
      this.handleError(error); // Handle any errors that occur during the update process
    } finally {
      await queryRunner.release(); // Release the query runner
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id); // Ensure the product exists before attempting to delete it
    await this.productRepository.remove(product); // Remove the product from the database
  }

  async findOnePlain(id: string) {
    const product = this.findOne(id); // Find a product by its ID
    const { images = [], ...rest } = await product; // Destructure images from the product, defaulting to an empty array if not provided
    return {
      ...rest, // Return the rest of the product properties
      images: images.map(image => image.url) // Map the images to their URLs
    }; // Return the product with its image URLs
  }

  private handleError(error: any) {
    this.logger.error(error); // Log the error
    if (error.code === '23505') { // Unique constraint violation
      throw new BadRequestException('Product already exists'); // Throw a bad request exception
    }
    throw new InternalServerErrorException('An unexpected error occurred'); // Throw an internal server error exception
  }

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('product');
    try {
      await query
        .delete()
        .where({})
        .execute(); // Delete all products from the database
      return true; // Return true if the deletion was successful
    } catch (error) {
      this.handleError(error); // Handle any errors that occur during the deletion process
    }
  }
}
