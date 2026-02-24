import { Transform, Type } from "class-transformer";
import { IsNumber, IsString, Min } from "class-validator";

export class CreateProductDto {
    @IsString()
    @Transform(({ value }) => value.trim())
    public name: string;

    @IsNumber({
        maxDecimalPlaces: 2
    })
    @Min(0)
    @Type(() => Number)
    public price: number;
}
