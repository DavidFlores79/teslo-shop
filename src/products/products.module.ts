import { Module } from '@nestjs/common';
import { ProductsController } from './controller/products.controller';
import { ProductsService } from './service/products.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product, ProductImage } from './entities';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  imports: [TypeOrmModule.forFeature([Product, ProductImage])], // Add your entities here, e.g., TypeOrmModule.forFeature([Product])
  exports: [ProductsService], // Export ProductsService if needed in other modules
})
export class ProductsModule {}

