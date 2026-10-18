//! Original shared primitives and state traits without a native QMDB backend.
pub use base_common::*;
pub mod state_db { pub use base_common::{Namespace, StateStore}; }
use std::future::Future;
use commonware_cryptography::sha256::Digest;
/// Directly committed authenticated state.
pub trait CommitState {
    /// Flush all staged writes, returning the new authenticated state root.
    fn commit(&mut self) -> impl Future<Output = Result<Digest, StateError>> + Send;
    /// The most recently committed authenticated state root.
    fn root(&self) -> Digest;
}
// The memory store does not implement CommitState. No root/commit is claimed.

