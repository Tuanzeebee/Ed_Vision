import 'package:flutter/foundation.dart';

@immutable
class LoginCredentials {
  const LoginCredentials({
    required this.email,
    required this.password,
  });

  final String email;
  final String password;

  factory LoginCredentials.empty() => const LoginCredentials(email: '', password: '');

  LoginCredentials copyWith({
    String? email,
    String? password,
  }) {
    return LoginCredentials(
      email: email ?? this.email,
      password: password ?? this.password,
    );
  }

  bool get isEmailValid {
    final value = email.trim();
    if (value.isEmpty) return false;
    return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(value);
  }

  bool get isPasswordValid => password.trim().isNotEmpty;
}

