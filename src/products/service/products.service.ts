import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import { Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dtos/pagination.dto';


@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductService'); // Initialize a logger for the service

  constructor( 
    @InjectRepository(Product) // Inject the Product repository
    private readonly productRepository: Repository<Product>, // Use the Product entity
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {

      const product = this.productRepository.create(createProductDto); // Create a new product instance
      return await this.productRepository.save(product); // Save the product to the database
      
    } catch (error) {
      this.handleError(error); // Handle any errors that occur during the creation process
    }
  }

  async findAll(paginationDto: PaginationDto) {
    return await this.productRepository.find({
      take: paginationDto.limit || 10, // Limit the number of results returned
      skip: paginationDto.offset || 0, // Skip a number of results for pagination
    }); // Retrieve all products from the database
  }

  async findOne(id: string) {

    const product = await this.productRepository.findOne({ where: { id } }); // Find a product by its ID
    if (!product) {
      throw new NotFoundException(`Product with Id: ${id}  not found`); // Throw an exception if the product does not exist
    }
    
    return product; // Return the found product
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    
    const product = await this.productRepository.preload({
      id, // Preload the product with the given ID
      ...updateProductDto, // Update the product with the new data
    });

    if (!product) {
      throw new NotFoundException(`Product with Id: ${id} not found`); // Throw an exception if the product does not exist
    }
    
    try {
      return await this.productRepository.save(product); // Save the updated product to the database
    } catch (error) {
      this.handleError(error); // Handle any errors that occur during the update process
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id); // Ensure the product exists before attempting to delete it
    await this.productRepository.remove(product); // Remove the product from the database
  }

  private handleError(error: any) {
    this.logger.error(error); // Log the error
    if (error.code === '23505') { // Unique constraint violation
      throw new BadRequestException('Product already exists'); // Throw a bad request exception
    }
    throw new InternalServerErrorException('An unexpected error occurred'); // Throw an internal server error exception
  }
}
