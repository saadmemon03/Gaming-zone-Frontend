import {type InputHTMLAttributes,forwardRef} from "react";

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="
              mb-2 block text-sm
              font-medium text-slate-300
            "
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={id}
          className={`
            h-10 w-full rounded-lg
            border bg-[#0B0F19]
            px-3 text-sm text-white
            outline-none
            placeholder:text-slate-600
            transition
            ${
              error
                ? "border-red-500 focus:border-red-500"
                : "border-[#273449] focus:border-[#7C3AED]"
            }
            ${className}
          `}
          {...props}
        />

        {error && (
          <p className="mt-1 text-xs text-red-400">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p className="mt-1 text-xs text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;