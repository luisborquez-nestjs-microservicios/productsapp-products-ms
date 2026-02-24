import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma.service';
import { PaginationDto } from 'src/common';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) { }

  async create(createProductDto: CreateProductDto) {
    const existsByName = await this.findOneByName(createProductDto.name);

    if (existsByName) {
      throw new RpcException({
        status: 'error',
        message: `Product with name ${createProductDto.name} already exists`,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    const product = await this.prisma.product.create({
      data: createProductDto
    });

    return product;
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;

    const totalProducts = await this.prisma.product.count({ where: { available: true } });
    const products = await this.prisma.product.findMany({
      skip: (page! - 1) * limit!,
      take: limit,
      where: { available: true }
    });
    const lastPage = Math.ceil(totalProducts / limit!);

    return {
      meta: {
        page: page,
        limit: limit,
        total: totalProducts,
        lastPage: lastPage,
        next: ((totalProducts / limit!) > page!) ? `/api/products?page=${(page! + 1)}&limit=${limit}` : null,
        prev: (page! > 1) ? `/api/products?page=${(page! - 1)}&limit=${limit}` : null,
      },
      data: products,
    }
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: id,
        available: true
      }
    });

    if (!product) {
      throw new RpcException({
        status: 'error',
        message: `Product not found with id ${id}`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    return product;
  }

  async findOneByName(name: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        name: name
      }
    });

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    await this.findOne(id);
    const { id: __, ...data } = updateProductDto;

    if (data.name) {
      const existsByName = await this.findOneByName(data.name);

      if (existsByName && id !== existsByName.id) {
        throw new RpcException({
          status: 'error',
          message: `Product with name ${data.name} already exists`,
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }
    }

    return await this.prisma.product.update({
      where: {
        id,
      },
      data: data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    // return await this.prisma.product.delete({ where: { id } }); // Hard delete
    const product = await this.prisma.product.update({
      where: { id },
      data: { available: false }
    }); // Soft delete

    return product
  }

  async validateProducts(ids: number[]) {
    ids = Array.from(new Set(ids));

    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: ids
        }
      }
    });

    if (ids.length !== products.length) {
      throw new RpcException({
        status: 'error',
        message: `Some products were not found`,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    return products;
  }
}
