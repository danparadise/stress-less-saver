export const PasswordRequirements = () => {
  return (
    <div className="text-center text-sm text-purple-600">
      <p>Password requirements:</p>
      <ul className="mt-2 space-y-1">
        <li>• Minimum 8 characters</li>
        <li>• At least one uppercase letter</li>
        <li>• At least one number</li>
        <li>• At least one special character (!@#$%^&*)</li>
      </ul>
    </div>
  );
};