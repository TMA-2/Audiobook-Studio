// ========================================
// React + TypeScript JSDoc Boilerplate
// ========================================

//region React

/** INTERFACE COMPONENT
 * Props for the Button component.
 * @typedef {Object} ButtonProps
 * @property {string} label - The text displayed on the button.
 * @property {() => void} onClick - Function to call when the button is clicked.
 * @property {boolean} [disabled=false] - Whether the button is disabled.
 */
// export interface ButtonProps {label: string; onClick: () => void; disabled?: boolean;}

/** FUNCTIONAL COMPONENT
 * A reusable button component.
 * @component
 * @param {ButtonProps} props - The props for the Button component.
 * @returns {JSX.Element} The rendered button element.
 * @example
 * <Button label="Click Me" onClick={() => alert('Clicked!')} />
 */
// export const Button: React.FC<ButtonProps> = ({ label, onClick, disabled = false }) => {};

/** INTERFACE COMPONENT
 * Props for the Card component.
 * @typedef {Object} CardProps
 * @property {string} title - Title text displayed at the top of the card.
 * @property {string} [description=''] - Description text.
 * @property {ReactNode} children - Child elements to render inside the card
 */
// export interface CardProps {title: string; description?: string; children: React.ReactNode;}

/** CONST COMPONENT
 * A card UI container.
 *
 * @component
 * @param {CardProps} props - The props for the Card component.
 * @returns {JSX.Element} The rendered card element.
 */
// export const Card: React.FC<CardProps> = ({ title, description, children }) => ();

/** HOOK FUNCTION
 * Custom hook to track window size.
 *
 * @returns {{ width: number, height: number }} The current window dimensions.
 * @example
 * const { width, height } = useWindowSize();
 */
// export function useWindowSize() { const [size, setSize = React.useState({}); React.useEffect(() => {}, []); return;

/** FORM FUNCTION
 * Handles form submission.
 *
 * @param {React.FormEvent<HTMLFormElement>} e - The form submit event.
 */
// export function handleSubmit(e: React.FormEvent<HTMLFormElement>) {};

//endregion

//region JSDoc

/** FUNCTION add(a: number, b: number): number {};
 * ============================================
 * Adds two numbers together.
 * @param {number} a - First number.
 * @param {number} b - Second number.
 * @returns {number} Sum of a and b.
 */

/** FUNCTION (ASYNC) fetchData(url: string): Promise<any> {};
 * ============================================
 * Fetches data from an API.
 * @async
 * @param {string} url - API endpoint.
 * @returns {Promise<any>} API response JSON.
 */

/** GENERIC FUNCTION firstElement<T>(arr: T[]): T {};
 * ============================================
 * Returns the first element of an array.
 * @template T
 * @param {T[]} arr - Input array.
 * @returns {T} First element.
 */

/** INTERFACE User {prop: type;};
 * Represents a user.
 * @property {number} id - Unique identifier.
 * @property {string} name - Full name of the user.
 */

/** ENUM Status {key = val[,etc]}
 * Status codes for an operation.
 * @enum {number}
 */

/** FUNCTION FULL
 * Calculates rectangle area.
 * @deprecated Use `calculateArea()` instead.
 * @param {number} width - Width of rectangle.
 * @param {number} height - Height of rectangle.
 * @throws {Error} If dimensions are negative.
 * @example
 * // returns 20
 * rectangleArea(4, 5);
 */

//endregion
