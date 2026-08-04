package com.kmate.app;

import android.os.CancellationSignal;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialException;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

@CapacitorPlugin(name = "NativeGoogleAuth")
public class NativeGoogleAuthPlugin extends Plugin {
    @PluginMethod
    public void signIn(PluginCall call) {
        String clientId = call.getString("serverClientId");
        if (clientId == null || clientId.isEmpty()) { call.reject("Google client ID is missing"); return; }
        GetSignInWithGoogleOption option = new GetSignInWithGoogleOption.Builder(clientId).build();
        GetCredentialRequest request = new GetCredentialRequest.Builder().addCredentialOption(option).build();
        CredentialManager manager = CredentialManager.create(getActivity());
        manager.getCredentialAsync(getActivity(), request, new CancellationSignal(), ContextCompat.getMainExecutor(getContext()),
            new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                @Override public void onResult(GetCredentialResponse result) {
                    Credential credential = result.getCredential();
                    if (!(credential instanceof CustomCredential) || !GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(credential.getType())) {
                        call.reject("Google did not return an ID token"); return;
                    }
                    try {
                        GoogleIdTokenCredential google = GoogleIdTokenCredential.createFrom(((CustomCredential) credential).getData());
                        JSObject response = new JSObject(); response.put("idToken", google.getIdToken()); call.resolve(response);
                    } catch (Exception error) { call.reject("Google credential could not be read", error); }
                }
                @Override public void onError(GetCredentialException error) { call.reject("Google sign-in was cancelled or failed", error); }
            });
    }
}
