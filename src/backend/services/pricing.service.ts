export interface BookFormat {
   id: string;
   title: string;
   dimensions: string;
   softcover: number | null;
   hardcover: number | null;
   dutchBook: number;
   appAndSoftware?: boolean;
   allInterfaces?: boolean;
   softwareOnly?: boolean;
}

export interface ShippingOption {
   id: string;
   title: string;
   description: string;
   promotionalPrice: number;
   regularPrice: number;
   estimatedDays: number;
}

export class PricingService {
   private static bookFormats: BookFormat[] = [
      {
         id: "mini-magnifier",
         title: "Mini magnifier",
         dimensions: "cm 15/15",
         softcover: 69,
         hardcover: 79,
         dutchBook: 257,
         appAndSoftware: true,
      },
      {
         id: "large-panoramic",
         title: "Large panoramic",
         dimensions: "cm 30/22",
         softcover: null,
         hardcover: 187,
         dutchBook: 257,
         appAndSoftware: true,
      },
      {
         id: "classic",
         title: "Classic",
         dimensions: "cm 20/28",
         softcover: 141,
         hardcover: 200,
         dutchBook: 258,
         softwareOnly: true,
      },
      {
         id: "classic-plus",
         title: "Classic Plus",
         dimensions: "cm 22.5/29",
         softcover: null,
         hardcover: 200,
         dutchBook: 258,
         appAndSoftware: true,
      },
      {
         id: "large-square",
         title: "Large square",
         dimensions: "cm 30/30",
         softcover: null,
         hardcover: 255,
         dutchBook: 347,
         allInterfaces: true,
      },
      {
         id: "small-square",
         title: "Small square",
         dimensions: "cm 20/20",
         softcover: 140,
         hardcover: 176,
         dutchBook: 248,
         allInterfaces: true,
      },
   ];

   private static shippingOptions: ShippingOption[] = [
      {
         id: "asphalt-collection",
         title: "Asphalt-collection calls",
         description: "from Rish'ta",
         promotionalPrice: 0,
         regularPrice: 0,
         estimatedDays: 7,
      },
      {
         id: "delivery-points",
         title: "Collection from delivery points",
         description: "",
         promotionalPrice: 18,
         regularPrice: 26,
         estimatedDays: 4,
      },
      {
         id: "home-delivery",
         title: "Home delivery",
         description: "",
         promotionalPrice: 39,
         regularPrice: 39,
         estimatedDays: 3,
      },
      {
         id: "certified-mail",
         title: "Certified mail",
         description: "",
         promotionalPrice: 26,
         regularPrice: 30,
         estimatedDays: 14,
      },
   ];

   static getBookFormats(): BookFormat[] {
      return this.bookFormats;
   }

   static getShippingOptions(): ShippingOption[] {
      return this.shippingOptions;
   }

   static getBookFormat(formatId: string): BookFormat | null {
      return this.bookFormats.find(format => format.id === formatId) || null;
   }

   static getShippingOption(optionId: string): ShippingOption | null {
      return (
         this.shippingOptions.find(option => option.id === optionId) || null
      );
   }

   static calculateBookPrice(
      formatId: string,
      coverType: "softcover" | "hardcover" | "dutch",
      pageCount: number = 24
   ): number {
      const format = this.getBookFormat(formatId);
      if (!format) {
         throw new Error(`Invalid book format: ${formatId}`);
      }

      let basePrice: number;

      switch (coverType) {
         case "softcover":
            if (format.softcover === null) {
               throw new Error(
                  `Softcover not available for format: ${formatId}`
               );
            }
            basePrice = format.softcover;
            break;
         case "hardcover":
            if (format.hardcover === null) {
               throw new Error(
                  `Hardcover not available for format: ${formatId}`
               );
            }
            basePrice = format.hardcover;
            break;
         case "dutch":
            basePrice = format.dutchBook;
            break;
         default:
            throw new Error(`Invalid cover type: ${coverType}`);
      }

      // Calculate additional page cost (every 2 pages above 24)
      const additionalPages = Math.max(0, pageCount - 24);
      const additionalPageSets = Math.ceil(additionalPages / 2);
      const additionalPageCost = additionalPageSets * 5; // 5 NIS per 2-page set

      return basePrice + additionalPageCost;
   }

   static calculateShippingPrice(
      optionId: string,
      isPromotionalUser: boolean = false
   ): number {
      const option = this.getShippingOption(optionId);
      if (!option) {
         throw new Error(`Invalid shipping option: ${optionId}`);
      }

      return isPromotionalUser ? option.promotionalPrice : option.regularPrice;
   }

   static calculateTotalPrice(
      formatId: string,
      coverType: "softcover" | "hardcover" | "dutch",
      pageCount: number,
      shippingOptionId: string,
      quantity: number = 1,
      isPromotionalUser: boolean = false
   ): {
      bookPrice: number;
      shippingPrice: number;
      subtotal: number;
      total: number;
   } {
      const bookPrice = this.calculateBookPrice(formatId, coverType, pageCount);
      const shippingPrice = this.calculateShippingPrice(
         shippingOptionId,
         isPromotionalUser
      );
      const subtotal = bookPrice * quantity;
      const total = subtotal + shippingPrice;

      return {
         bookPrice,
         shippingPrice,
         subtotal,
         total,
      };
   }

   static validateBookConfiguration(
      formatId: string,
      coverType: "softcover" | "hardcover" | "dutch"
   ): boolean {
      const format = this.getBookFormat(formatId);
      if (!format) return false;

      if (coverType === "softcover" && format.softcover === null) {
         return false;
      }

      return true;
   }

   static getEstimatedDeliveryDate(shippingOptionId: string): Date {
      const option = this.getShippingOption(shippingOptionId);
      if (!option) {
         throw new Error(`Invalid shipping option: ${shippingOptionId}`);
      }

      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + option.estimatedDays);
      return estimatedDate;
   }

   static generateOrderNumber(): string {
      const timestamp = Date.now().toString(36);
      const randomStr = Math.random().toString(36).substr(2, 5);
      return `ALB-${timestamp}-${randomStr}`.toUpperCase();
   }
}
