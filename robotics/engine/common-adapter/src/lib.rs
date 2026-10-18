//! Browser bindings for original SDK primitives; no QMDB persistence or consensus.
pub use sdk_common::*;
use std::future::Future;
use commonware_cryptography::{sha256::Digest,Hasher,Sha256};
use thiserror::Error;
#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct RuntimeContext {
    pub epoch: u64,
    pub height: u64,
    pub timestamp_ms: u64,
    pub block_digest: Option<commonware_cryptography::sha256::Digest>,
}

#[derive(Debug, Error)]
pub enum StateError {
    /// A failure originating from the underlying authenticated storage.
    #[error("state backend error: {0}")]
    Backend(String),

    /// A state value exceeds the chain-wide limit.
    #[error("state value is too large: size {size}, maximum {max}")]
    ValueTooLarge {
        /// Encoded value size.
        size: usize,
        /// Maximum accepted size.
        max: usize,
    },
}

/// A deterministic, collision-resistant view into the shared keyspace owned by a single module.
///
/// Modules declare a stable namespace tag (typically their signing domain separator) and a small
/// `table` discriminant per logical map. Keys are length-prefixed before hashing so that distinct
/// `(tag, table, logical)` triples can never alias.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct Namespace {
    tag: &'static [u8],
}

impl Namespace {
    /// Create a namespace from a stable, module-unique tag.
    pub const fn new(tag: &'static [u8]) -> Self {
        Self { tag }
    }

    /// Derive the physical storage key for a logical entry within `table`.
    ///
    /// `table` discriminates the module's logical maps so two maps with same-shaped keys (e.g. a
    /// 32-byte account id vs. a 32-byte coin id) land in disjoint sub-keyspaces. Modules typically
    /// pass a `#[repr(u8)]` enum here.
    pub fn key(&self, table: impl Into<u8>, logical: &[u8]) -> Digest {
        let mut hasher = Sha256::default();
        hasher.update(&(self.tag.len() as u32).to_be_bytes());
        hasher.update(self.tag);
        hasher.update(&[table.into()]);
        hasher.update(logical);
        hasher.finalize().1
    }
}

/// Namespaced read/write access shared across modules.
///
/// Reads observe staged writes (read-your-writes) so a module can apply a multi-step operation
/// before either committing a direct database or merkleizing a speculative batch.
pub trait StateStore {
    /// Read the committed-or-staged value for `key`.
    fn get(&self, key: &Digest)
        -> impl Future<Output = Result<Option<Vec<u8>>, StateError>> + Send;

    /// Stage an upsert. Visible to subsequent [`StateStore::get`] calls.
    fn set(&mut self, key: Digest, value: Vec<u8>);

    /// Stage a deletion. Visible to subsequent [`StateStore::get`] calls.
    fn remove(&mut self, key: Digest);
}

