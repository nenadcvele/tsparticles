import type { ICoordinates } from "../Core/Interfaces/ICoordinates";
import { MoveDirection } from "../Enums";
import type { ICharacterShape } from "../Options/Interfaces/Particles/Shape/ICharacterShape";
import type { IBounds } from "../Core/Interfaces/IBounds";
import type { IDimension } from "../Core/Interfaces/IDimension";
import type { IImage } from "../Core/Interfaces/IImage";
import type { IParticle } from "../Core/Interfaces/IParticle";
import { ColorUtils } from "./ColorUtils";
import { IHsl } from "../Core/Interfaces/IHsl";

type CSSOMString = string;
type FontFaceLoadStatus = "unloaded" | "loading" | "loaded" | "error";
type FontFaceSetStatus = "loading" | "loaded";

interface FontFace {
    family: CSSOMString;
    style: CSSOMString;
    weight: CSSOMString;
    stretch: CSSOMString;
    unicodeRange: CSSOMString;
    variant: CSSOMString;
    featureSettings: CSSOMString;
    variationSettings: CSSOMString;
    display: CSSOMString;
    readonly status: FontFaceLoadStatus;
    readonly loaded: Promise<FontFace>;

    load(): Promise<FontFace>;
}

interface FontFaceSet {
    readonly status: FontFaceSetStatus;
    readonly ready: Promise<FontFaceSet>;

    check(font: string, text?: string): boolean;

    load(font: string, text?: string): Promise<FontFace[]>;
}

declare global {
    interface Document {
        fonts: FontFaceSet;
    }
}

/* ---------- global functions - vendors ------------ */
export class Utils {
    public static replaceColorSvg(image: IImage, color: IHsl, opacity: number): string {
        if (!image.svgData) {
            return "";
        }

        /* set color to svg element */
        const svgXml = image.svgData;
        const rgbHex = /#([0-9A-F]{3,6})/gi;

        return svgXml.replace(rgbHex, () => ColorUtils.getStyleFromHsl(color, opacity));
    }

    /**
     * Clamps a number between a minimum and maximum value
     * @param num the source number
     * @param min the minimum value
     * @param max the maximum value
     */
    public static clamp(num: number, min: number, max: number): number {
        return Math.min(Math.max(num, min), max);
    }

    /**
     * Check if a value is equal to the destination, if same type, or is in the provided array
     * @param value the value to check
     * @param array the data array or single value
     */
    public static isInArray<T>(value: T, array: T[] | T): boolean {
        return value === array || (array instanceof Array && array.indexOf(value) > -1);
    }

    /**
     *
     * @param comp1
     * @param comp2
     * @param weight1
     * @param weight2
     */
    public static mix(comp1: number, comp2: number, weight1: number, weight2: number): number {
        return Math.floor((comp1 * weight1 + comp2 * weight2) / (weight1 + weight2));
    }

    /**
     * Get Particle base velocity
     * @param particle the particle to use for calculating the velocity
     */
    public static getParticleBaseVelocity(particle: IParticle): ICoordinates {
        let velocityBase: ICoordinates;

        switch (particle.direction) {
            case MoveDirection.top:
                velocityBase = { x: 0, y: -1 };
                break;
            case MoveDirection.topRight:
                velocityBase = { x: 0.5, y: -0.5 };
                break;
            case MoveDirection.right:
                velocityBase = { x: 1, y: -0 };
                break;
            case MoveDirection.bottomRight:
                velocityBase = { x: 0.5, y: 0.5 };
                break;
            case MoveDirection.bottom:
                velocityBase = { x: 0, y: 1 };
                break;
            case MoveDirection.bottomLeft:
                velocityBase = { x: -0.5, y: 1 };
                break;
            case MoveDirection.left:
                velocityBase = { x: -1, y: 0 };
                break;
            case MoveDirection.topLeft:
                velocityBase = { x: -0.5, y: -0.5 };
                break;
            default:
                velocityBase = { x: 0, y: 0 };
                break;
        }

        return velocityBase;
    }

    /**
     * Gets the distance between two coordinates
     * @param pointA the first coordinate
     * @param pointB the second coordinate
     */
    public static getDistances(
        pointA: ICoordinates,
        pointB: ICoordinates
    ): { dx: number; dy: number; distance: number } {
        const dx = pointA.x - pointB.x;
        const dy = pointA.y - pointB.y;
        return { dx: dx, dy: dy, distance: Math.sqrt(dx * dx + dy * dy) };
    }

    /**
     * Gets the distance between two coordinates
     * @param pointA the first coordinate
     * @param pointB the second coordinate
     */
    public static getDistance(pointA: ICoordinates, pointB: ICoordinates): number {
        return this.getDistances(pointA, pointB).distance;
    }

    public static async loadFont(character: ICharacterShape): Promise<void> {
        try {
            await document.fonts.load(`${character.weight} 36px '${character.font}'`);
        } catch {
            // ignores any error
        }
    }

    public static arrayRandomIndex<T>(array: T[]): number {
        return Math.floor(Math.random() * array.length);
    }

    public static itemFromArray<T>(array: T[], index?: number): T {
        return array[index !== undefined ? index : this.arrayRandomIndex(array)];
    }

    public static randomInRange(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    public static isPointInside(point: ICoordinates, size: IDimension, radius?: number): boolean {
        return this.areBoundsInside(this.calculateBounds(point, radius ?? 0), size);
    }

    public static areBoundsInside(bounds: IBounds, size: IDimension): boolean {
        return bounds.left < size.width && bounds.right > 0 && bounds.top < size.height && bounds.bottom > 0;
    }

    public static calculateBounds(point: ICoordinates, radius: number): IBounds {
        return {
            bottom: point.y + radius,
            left: point.x - radius,
            right: point.x + radius,
            top: point.y - radius,
        };
    }

    public static loadImage(source: string): Promise<IImage> {
        return new Promise(
            (
                resolve: (value?: IImage | PromiseLike<IImage> | undefined) => void,
                reject: (reason?: string) => void
            ) => {
                const image: IImage = {
                    source: source,
                    type: source.substr(source.length - 3),
                };

                if (source) {
                    const img = new Image();

                    img.addEventListener("load", () => {
                        image.element = img;

                        resolve(image);
                    });

                    img.addEventListener("error", () => {
                        reject(`Error tsParticles - loading image: ${source}`);
                    });

                    img.src = source;
                } else {
                    reject("Error tsParticles - No image.src");
                }
            }
        );
    }

    public static async downloadSvgImage(source: string): Promise<IImage> {
        if (source) {
            const image: IImage = {
                source: source,
                type: source.substr(source.length - 3),
            };

            if (image.type !== "svg") {
                return this.loadImage(source);
            }

            const response = await fetch(image.source);

            if (response.ok) {
                image.svgData = await response.text();

                return image;
            } else {
                throw new Error("Error tsParticles - Image not found");
            }
        } else {
            throw new Error("Error tsParticles - No image.src");
        }
    }

    public static deepExtend(destination: any, ...sources: any): any {
        for (const source of sources) {
            if (source === undefined || source === null) {
                continue;
            }

            const typeOfSource = typeof source;

            if (typeOfSource === "object") {
                const sourceIsArray = Array.isArray(source);

                if (sourceIsArray) {
                    if (typeof destination !== "object" || !destination || !Array.isArray(destination)) {
                        destination = [];
                    }
                } else {
                    if (typeof destination !== "object" || !destination || Array.isArray(destination)) {
                        destination = {};
                    }
                }

                for (const key in source) {
                    if (key === "__proto__") {
                        continue;
                    }

                    const value = source[key];
                    const isObject = typeof value === "object";

                    destination[key] =
                        isObject && Array.isArray(value)
                            ? value.map((v) => this.deepExtend(destination[key], v))
                            : this.deepExtend(destination[key], value);
                }
            } else {
                destination = source;
            }
        }
        return destination;
    }
}
