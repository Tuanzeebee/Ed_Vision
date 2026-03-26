import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/login_model.dart';

final loginViewModelProvider =
    NotifierProvider<LoginViewModel, LoginViewState>(LoginViewModel.new);

@immutable
class LoginUiMessage {
  const LoginUiMessage({
    required this.text,
    this.isError = true,
  });

  final String text;
  final bool isError;
}

@immutable
class LoginViewState {
  const LoginViewState({
    required this.credentials,
    required this.isPasswordVisible,
    required this.isGoogleLoading,
    required this.isSubmitting,
  });

  final LoginCredentials credentials;
  final bool isPasswordVisible;
  final bool isGoogleLoading;
  final bool isSubmitting;

  factory LoginViewState.initial() {
    return LoginViewState(
      credentials: LoginCredentials.empty(),
      isPasswordVisible: false,
      isGoogleLoading: false,
      isSubmitting: false,
    );
  }

  LoginViewState copyWith({
    LoginCredentials? credentials,
    bool? isPasswordVisible,
    bool? isGoogleLoading,
    bool? isSubmitting,
  }) {
    return LoginViewState(
      credentials: credentials ?? this.credentials,
      isPasswordVisible: isPasswordVisible ?? this.isPasswordVisible,
      isGoogleLoading: isGoogleLoading ?? this.isGoogleLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
    );
  }
}

class LoginViewModel extends Notifier<LoginViewState> {
  @override
  LoginViewState build() => LoginViewState.initial();

  void setEmail(String value) {
    state = state.copyWith(credentials: state.credentials.copyWith(email: value));
  }

  void setPassword(String value) {
    state =
        state.copyWith(credentials: state.credentials.copyWith(password: value));
  }

  void togglePasswordVisibility() {
    state = state.copyWith(isPasswordVisible: !state.isPasswordVisible);
  }

  Future<LoginUiMessage> signInWithGoogle() async {
    if (state.isGoogleLoading) {
      return const LoginUiMessage(text: 'Vui lòng đợi thao tác trước hoàn tất.');
    }

    state = state.copyWith(isGoogleLoading: true);
    try {
      await Future<void>.delayed(const Duration(seconds: 2));
      return const LoginUiMessage(text: 'Google OAuth sẽ được tích hợp tại đây');
    } finally {
      state = state.copyWith(isGoogleLoading: false);
    }
  }

  Future<LoginUiMessage> submit() async {
    if (state.isSubmitting) {
      return const LoginUiMessage(text: 'Vui lòng đợi thao tác trước hoàn tất.');
    }

    if (!state.credentials.isEmailValid) {
      return const LoginUiMessage(text: 'Email không hợp lệ.');
    }

    if (!state.credentials.isPasswordValid) {
      return const LoginUiMessage(text: 'Vui lòng nhập mật khẩu.');
    }

    state = state.copyWith(isSubmitting: true);
    try {
      await Future<void>.delayed(const Duration(milliseconds: 1500));
      return const LoginUiMessage(
        text: 'Đăng nhập sẽ gọi backend API tại đây',
        isError: true,
      );
    } finally {
      state = state.copyWith(isSubmitting: false);
    }
  }

  LoginUiMessage back() {
    return const LoginUiMessage(
      text: 'Back button clicked - would navigate to /student/landing',
    );
  }

  LoginUiMessage register() {
    return const LoginUiMessage(text: 'Would navigate to /auth/register');
  }

  LoginUiMessage resetPassword() {
    return const LoginUiMessage(text: 'Would navigate to /auth/forgot-password');
  }
}
