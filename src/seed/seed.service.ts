import { HttpCode, Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/service/products.service';
import { initialData } from './data/seed-data';

@Injectable()
export class SeedService {

  constructor(private readonly productsService: ProductsService) {
    // This constructor is intended for dependency injection if needed in the future
  }

  executeSeed() {
    // This method is intended to execute the seed operation
    this.productsService.deleteAllProducts();
    
    const products = initialData.products;
    const insertPromises = [];
    products.forEach(async product => {
      await this.productsService.create(product);
    });
  }
}
