import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../viewmodels/login_viewmodel.dart';
import '../widgets/login_widgets.dart';

class StudentLoginScreen extends ConsumerStatefulWidget {
  const StudentLoginScreen({super.key});

  @override
  ConsumerState<StudentLoginScreen> createState() => _StudentLoginScreenState();
}

class _StudentLoginScreenState extends ConsumerState<StudentLoginScreen> {
  final _formKey = GlobalKey<FormState>();
  String? _toastMessage;
  bool _isToastError = true;
  bool _showToast = false;

  void _showToastNotification(String message, bool isError) {
    setState(() {
      _toastMessage = message;
      _isToastError = isError;
      _showToast = true;
    });
  }

  void _hideToast() {
    setState(() {
      _showToast = false;
    });
  }

  Widget _buildToast() {
    if (!_showToast || _toastMessage == null) {
      return const SizedBox.shrink();
    }
    return ToastNotification(
      message: _toastMessage!,
      isError: _isToastError,
      onDismiss: _hideToast,
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(loginViewModelProvider);
    final vm = ref.read(loginViewModelProvider.notifier);
    final width = MediaQuery.sizeOf(context).width;
    final isMdUp = width >= 768;

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: Stack(
        children: [
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () {
                      final msg = vm.back();
                      _showToastNotification(msg.text, msg.isError);
                    },
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 6),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Icon(
                            Icons.arrow_back,
                            color: Color(0xFF4B5563),
                            size: 20,
                          ),
                          SizedBox(width: 8),
                          Text(
                            'Back',
                            style: TextStyle(
                              color: Color(0xFF4B5563),
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final verticalPadding = isMdUp ? 16.0 : 64.0;
                return SingleChildScrollView(
                  padding: EdgeInsets.symmetric(horizontal: 16, vertical: verticalPadding),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(minHeight: constraints.maxHeight),
                    child: Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 384),
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 26),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(24),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Column(
                                  children: const [
                                    Text(
                                      'EdVision',
                                      style: TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.w700,
                                        color: Color(0xFF111827),
                                        letterSpacing: 0.2,
                                      ),
                                    ),
                                    SizedBox(height: 4),
                                    Text(
                                      'Student Login',
                                      style: TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF1F2937),
                                      ),
                                    ),
                                    SizedBox(height: 4),
                                    Text(
                                      'Sign in to access your account',
                                      style: TextStyle(
                                        fontSize: 14,
                                        color: Color(0xFF6B7280),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 24),
                                GoogleSignInButton(
                                  isLoading: state.isGoogleLoading,
                                  onPressed: () async {
                                    final message = await vm.signInWithGoogle();
                                    _showToastNotification(message.text, message.isError);
                                  },
                                ),
                                const SizedBox(height: 16),
                                const AuthDivider(text: 'or sign in with email'),
                                const SizedBox(height: 16),
                                Form(
                                  key: _formKey,
                                  child: Column(
                                    children: [
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text(
                                            'Email Address',
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w500,
                                              color: Color(0xFF374151),
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          TextFormField(
                                            initialValue: state.credentials.email,
                                            keyboardType: TextInputType.emailAddress,
                                            textInputAction: TextInputAction.next,
                                            style: const TextStyle(
                                              fontSize: 14,
                                              color: Color(0xFF111827),
                                            ),
                                            decoration: InputDecoration(
                                              hintText: 'Enter your email',
                                              hintStyle: const TextStyle(
                                                fontSize: 14,
                                                color: Color(0xFF9CA3AF),
                                              ),
                                              filled: true,
                                              fillColor: Colors.white,
                                              border: OutlineInputBorder(
                                                borderRadius: BorderRadius.circular(8),
                                                borderSide: const BorderSide(
                                                  color: Color(0xFFD1D5DB),
                                                  width: 1,
                                                ),
                                              ),
                                              enabledBorder: OutlineInputBorder(
                                                borderRadius: BorderRadius.circular(8),
                                                borderSide: const BorderSide(
                                                  color: Color(0xFFD1D5DB),
                                                  width: 1,
                                                ),
                                              ),
                                              focusedBorder: OutlineInputBorder(
                                                borderRadius: BorderRadius.circular(8),
                                                borderSide: const BorderSide(
                                                  color: Color(0xFF8B5CF6),
                                                  width: 2,
                                                ),
                                              ),
                                              contentPadding: const EdgeInsets.symmetric(
                                                horizontal: 12,
                                                vertical: 10,
                                              ),
                                            ),
                                            onChanged: vm.setEmail,
                                            validator: (value) {
                                              final v = (value ?? '').trim();
                                              if (v.isEmpty) return 'Vui lòng nhập email.';
                                              final ok = RegExp(r'^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$').hasMatch(v);
                                              if (!ok) return 'Email không hợp lệ.';
                                              return null;
                                            },
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 16),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text(
                                            'Password',
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w500,
                                              color: Color(0xFF374151),
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          TextFormField(
                                            initialValue: state.credentials.password,
                                            obscureText: !state.isPasswordVisible,
                                            textInputAction: TextInputAction.done,
                                            style: const TextStyle(
                                              fontSize: 14,
                                              color: Color(0xFF111827),
                                            ),
                                            decoration: InputDecoration(
                                              hintText: 'Enter your password',
                                              hintStyle: const TextStyle(
                                                fontSize: 14,
                                                color: Color(0xFF9CA3AF),
                                              ),
                                              filled: true,
                                              fillColor: Colors.white,
                                              border: OutlineInputBorder(
                                                borderRadius: BorderRadius.circular(8),
                                                borderSide: const BorderSide(
                                                  color: Color(0xFFD1D5DB),
                                                  width: 1,
                                                ),
                                              ),
                                              enabledBorder: OutlineInputBorder(
                                                borderRadius: BorderRadius.circular(8),
                                                borderSide: const BorderSide(
                                                  color: Color(0xFFD1D5DB),
                                                  width: 1,
                                                ),
                                              ),
                                              focusedBorder: OutlineInputBorder(
                                                borderRadius: BorderRadius.circular(8),
                                                borderSide: const BorderSide(
                                                  color: Color(0xFF8B5CF6),
                                                  width: 2,
                                                ),
                                              ),
                                              contentPadding: const EdgeInsets.symmetric(
                                                horizontal: 12,
                                                vertical: 10,
                                              ),
                                              suffixIcon: IconButton(
                                                onPressed: vm.togglePasswordVisibility,
                                                icon: Icon(
                                                  state.isPasswordVisible ? Icons.visibility_off : Icons.visibility,
                                                  color: const Color(0xFF9CA3AF),
                                                  size: 20,
                                                ),
                                              ),
                                            ),
                                            onChanged: vm.setPassword,
                                            validator: (value) {
                                              final v = (value ?? '').trim();
                                              if (v.isEmpty) return 'Vui lòng nhập mật khẩu.';
                                              return null;
                                            },
                                            onFieldSubmitted: (_) async {
                                              if (!(_formKey.currentState?.validate() ?? false)) return;
                                              final message = await vm.submit();
                                              _showToastNotification(message.text, message.isError);
                                            },
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 20),
                                      AuthGradientButton(
                                        text: state.isSubmitting ? 'Signing in...' : 'Sign In',
                                        isLoading: state.isSubmitting,
                                        onPressed: state.isSubmitting
                                            ? null
                                            : () async {
                                                if (!(_formKey.currentState?.validate() ?? false)) return;
                                                final message = await vm.submit();
                                                _showToastNotification(message.text, message.isError);
                                              },
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 16),
                                Column(
                                  children: [
                                    Wrap(
                                      alignment: WrapAlignment.center,
                                      children: [
                                        const Text(
                                          "Don't have an account? ",
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Color(0xFF6B7280),
                                          ),
                                        ),
                                        GestureDetector(
                                          onTap: () {
                                            final msg = vm.register();
                                            _showToastNotification(msg.text, msg.isError);
                                          },
                                          child: const Text(
                                            'Register here',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Color(0xFF7C3AED),
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Wrap(
                                      alignment: WrapAlignment.center,
                                      children: [
                                        const Text(
                                          'Forgot your password? ',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Color(0xFF6B7280),
                                          ),
                                        ),
                                        GestureDetector(
                                          onTap: () {
                                            final msg = vm.resetPassword();
                                            _showToastNotification(msg.text, msg.isError);
                                          },
                                          child: const Text(
                                            'Reset it',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Color(0xFF7C3AED),
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          _buildToast(),
        ],
      ),
    );
  }
}
