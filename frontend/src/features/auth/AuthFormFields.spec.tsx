import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { FormField, ServerErrorBanner } from './AuthFormFields';

describe('AuthFormFields', () => {
  describe('FormField', () => {
    it('should render label and input correctly when required props are provided', () => {
      // Arrange
      render(
        <FormField 
          id="email" 
          label="Email Address" 
          name="email" 
          value="" 
          onChange={() => {}} 
        />
      );

      // Act & Assert
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'email');
    });

    it('should display error message when error prop is provided', () => {
      // Arrange
      render(
        <FormField 
          id="email" 
          label="Email" 
          name="email" 
          value="" 
          onChange={() => {}} 
          error="Invalid email format" 
        />
      );

      // Act & Assert
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email format');
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-invalid', 'true');
    });

    it('should call onChange handler when typed into', async () => {
      // Arrange
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      render(
        <FormField 
          id="email" 
          label="Email" 
          name="email" 
          value="" 
          onChange={handleChange} 
        />
      );
      
      // Act
      const input = screen.getByLabelText(/email/i);
      await user.type(input, 'a');

      // Assert
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('ServerErrorBanner', () => {
    it('should render message when error text is provided', () => {
      // Arrange & Act
      render(<ServerErrorBanner message="Network error" />);

      // Assert
      expect(screen.getByRole('alert')).toHaveTextContent('Network error');
    });

    it('should return null when no message is provided', () => {
      // Arrange & Act
      const { container } = render(<ServerErrorBanner message={null} />);

      // Assert
      expect(container).toBeEmptyDOMElement();
    });
  });
});
